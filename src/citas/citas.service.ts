import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { Prisma } from '@prisma/client';
import { QueryCitaDto } from './dto/query-cita.dto';
import { PublicService } from 'src/public/public.service';
import { EmailService } from 'src/email/email.service';

import { formatInTimeZone } from 'date-fns-tz';

@Injectable()
export class CitasService {
  private readonly timeZone = 'America/Bogota';

  constructor(
    private prisma: PrismaService,
    private publicService: PublicService,
    private emailService: EmailService,
  ) {}

  async create(createCitaDto: CreateCitaDto, userId: string) {
    const { startTime, serviceId, employeeId } = createCitaDto;

    const startTimeDate = new Date(startTime);
    console.log('start:time recibido (UTC): ', startTime);

    // 3. USAMOS formatInTimeZone
    // Esto convierte la hora UTC a la hora local de Colombia para la validación
    // Si UTC es 16:30, en Bogotá (UTC-5) será 11:30
    const dateString = formatInTimeZone(
      startTimeDate,
      this.timeZone,
      'yyyy-MM-dd',
    );
    const timeString = formatInTimeZone(startTimeDate, this.timeZone, 'HH:mm');

    console.log(
      `Validando disponibilidad local: Fecha ${dateString}, Hora ${timeString}`,
    );

    const availableSlots = await this.publicService.getAvailability({
      date: dateString,
      employeeId,
      serviceId,
    });

    if (!availableSlots.includes(timeString)) {
      throw new BadRequestException(
        `Error al crear la cita: La hora ${timeString} del día ${dateString} no está disponible.`,
      );
    }

    // 4. Obtener la duración del servicio para calcular endTime
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado.');
    // Validar que el servicio pertenezca al usuario
    if (service.userId !== userId) {
      throw new ForbiddenException('Servicio no válido.');
    }

    const endTimeDate = new Date(
      startTimeDate.getTime() + service.duration * 60000,
    );

    const cita = await this.prisma.cita.create({
      data: {
        ...createCitaDto,
        startTime: startTimeDate,
        endTime: endTimeDate,
        userId: userId,
        status: 'PENDING',
      },
      include: {
        cliente: true,
        service: true,
        employee: true,
        user: true,
      },
    });

    // --- 6. Disparar Emails ---
    if (cita.user && cita.cliente) {
      try {
        await this.emailService.sendBookingConfirmation(cita);
        await this.emailService.sendNewBookingNotification(
          cita,
          cita.user.email,
        );
      } catch (emailError) {
        console.error(
          'Fallo el envío de email, pero la cita se creó:',
          emailError,
        );
      }
    }
    // ----------------------------

    return cita;
  }

  /**
   * OBTENER TODAS las citas (del usuario logueado)
   */
  async findAll(userId: string, queryDto: QueryCitaDto) {
    const { page = 1, limit = 10, startDate, endDate, employeeId } = queryDto;
    const skip = (page - 1) * Number(limit);

    const whereClause: Prisma.CitaWhereInput = {
      userId: userId,
    };

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (startDate && endDate) {
      whereClause.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      whereClause.startTime = { gte: new Date(startDate) };
    }

    const [citas, total] = await this.prisma.$transaction([
      this.prisma.cita.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        orderBy: {
          startTime: 'asc',
        },
        include: {
          cliente: true,
          service: true,
          employee: true,
        },
      }),
      this.prisma.cita.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    return {
      data: citas,
      meta: {
        totalItems: total,
        currentPage: Number(page),
        totalPages: totalPages,
        itemsPerPage: Number(limit),
      },
    };
  }

  /**
   * OBTENER UNA cita (del usuario logueado)
   */
  async findOne(id: string, userId: string) {
    const cita = await this.prisma.cita.findUnique({
      where: { id },
      include: {
        cliente: true,
        service: true,
        employee: true,
      },
    });

    if (!cita) {
      throw new NotFoundException('Cita no encontrada');
    }
    if (cita.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver esta cita');
    }
    return cita;
  }

  /**
   * ACTUALIZAR una cita (del usuario logueado)
   */
  async update(id: string, updateCitaDto: UpdateCitaDto, userId: string) {
    // 1. Validar que la cita existe y pertenece al usuario
    await this.findOne(id, userId);

    // 2. Recalcular endTime si startTime o serviceId cambian
    let endTimeDate: Date | undefined = undefined;
    if (updateCitaDto.startTime || updateCitaDto.serviceId) {
      // Necesitamos los datos actuales
      const citaActual = await this.prisma.cita.findUnique({ where: { id } });
      const newStartTime = updateCitaDto.startTime
        ? new Date(updateCitaDto.startTime)
        : new Date(citaActual!.startTime);
      const newServiceId = updateCitaDto.serviceId || citaActual!.serviceId;

      const service = await this.prisma.service.findUnique({
        where: { id: newServiceId },
      });
      if (!service) throw new NotFoundException('Servicio no encontrado.');
      // Validar que el nuevo servicio también pertenezca al usuario
      if (service.userId !== userId) {
        throw new ForbiddenException(
          'No puedes asignar un servicio que no te pertenece.',
        );
      }
      endTimeDate = new Date(newStartTime.getTime() + service.duration * 60000);
    }

    // 3. Actualizar la cita
    return this.prisma.cita.update({
      where: { id },
      data: {
        ...updateCitaDto,
        startTime: updateCitaDto.startTime
          ? new Date(updateCitaDto.startTime)
          : undefined,
        endTime: endTimeDate,
      },
    });
  }

  /**
   * ELIMINAR una cita (del usuario logueado)
   */
  async remove(id: string, userId: string) {
    // 1. Validar que la cita existe y pertenece al usuario
    await this.findOne(id, userId);
    // 2. Eliminar la cita
    return this.prisma.cita.delete({
      where: { id },
    });
  }
}
