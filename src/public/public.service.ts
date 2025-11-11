import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { addMinutes, format, getDay, parse } from 'date-fns';
import { PublicBookingDto } from './dto/public-booking.dto';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class PublicService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // ... (getAvailability - sin cambios)
  async getAvailability(query: AvailabilityQueryDto) {
    const { date, employeeId, serviceId } = query;
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    const serviceDuration = service.duration;
    const selectedDate = parse(date, 'yyyy-MM-dd', new Date());
    const dayOfWeek = getDay(selectedDate);
    const employeeSchedule = await this.prisma.availability.findUnique({
      where: {
        employeeId_dayOfWeek: {
          employeeId,
          dayOfWeek,
        },
      },
    });
    if (
      !employeeSchedule ||
      !employeeSchedule.isAvailable ||
      !employeeSchedule.startTime ||
      !employeeSchedule.endTime
    ) {
      return [];
    }
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);
    const existingAppointments = await this.prisma.cita.findMany({
      where: {
        employeeId,
        startTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
        NOT: {
          status: 'CANCELLED',
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    const availableSlots: string[] = [];
    const interval = 15;
    const [startHour, startMinute] = employeeSchedule.startTime
      .split(':')
      .map(Number);
    const [endHour, endMinute] = employeeSchedule.endTime
      .split(':')
      .map(Number);
    let currentSlotTime = new Date(startOfDay).setHours(
      startHour,
      startMinute,
      0,
      0,
    );
    const endTime = new Date(startOfDay).setHours(endHour, endMinute, 0, 0);
    while (currentSlotTime < endTime) {
      const slotStartTime = new Date(currentSlotTime);
      const slotEndTime = addMinutes(slotStartTime, serviceDuration);
      if (slotEndTime.getTime() > endTime) {
        break;
      }
      let isOcupado = false;
      for (const cita of existingAppointments) {
        const citaStart = new Date(cita.startTime).getTime();
        const citaEnd = new Date(cita.endTime).getTime();
        const slotStart = slotStartTime.getTime();
        const slotEnd = slotEndTime.getTime();
        if (
          (slotStart < citaEnd && slotStart >= citaStart) ||
          (slotEnd > citaStart && slotEnd <= citaEnd) ||
          (slotStart <= citaStart && slotEnd >= citaEnd)
        ) {
          isOcupado = true;
          currentSlotTime = new Date(cita.endTime).getTime();
          break;
        }
      }
      if (!isOcupado) {
        availableSlots.push(format(slotStartTime, 'HH:mm'));
        currentSlotTime = addMinutes(slotStartTime, interval).getTime();
      }
    }
    return availableSlots;
  }

  // ... (getServicesByUserId - sin cambios)
  async getServicesByUserId(userId: string) {
    return this.prisma.service.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  // ... (getEmployeesByUserId - sin cambios)
  async getEmployeesByUserId(userId: string) {
    return this.prisma.employee.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    });
  }

  // ... (bookAppointment - sin cambios)
  async bookAppointment(data: PublicBookingDto) {
    const { date, startTime, employeeId, serviceId, userId } = data;
    const availableSlots = await this.getAvailability({
      date,
      employeeId,
      serviceId,
    });
    if (!availableSlots.includes(startTime)) {
      throw new BadRequestException(
        `La hora ${startTime} del ${date} ya no está disponible.`,
      );
    }
    const startTimeDate = parse(
      `${date}T${startTime}`,
      "yyyy-MM-dd'T'HH:mm",
      new Date(),
    );
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw new NotFoundException('Servicio no encontrado.');
    const endTimeDate = addMinutes(startTimeDate, service.duration);
    const cliente = await this.prisma.cliente.upsert({
      where: {
        userId_phone: {
          userId: data.userId,
          phone: data.clientPhone,
        },
      },
      update: {
        name: data.clientName,
        email: data.clientEmail,
      },
      create: {
        name: data.clientName,
        email: data.clientEmail,
        phone: data.clientPhone,
        userId: data.userId,
      },
    });
    const cita = await this.prisma.cita.create({
      data: {
        startTime: startTimeDate,
        endTime: endTimeDate,
        notes: data.notes,
        userId: data.userId,
        employeeId: data.employeeId,
        serviceId: data.serviceId,
        clienteId: cliente.id,
        status: 'PENDING',
        // El cancelToken se crea automáticamente por el @default(cuid())
      },
      include: {
        cliente: true,
        service: true,
        employee: true,
      },
    });
    const businessOwner = await this.prisma.user.findUnique({
      where: { id: data.userId },
    });
    if (businessOwner && cita.cliente) {
      try {
        await this.emailService.sendBookingConfirmation(cita);
        await this.emailService.sendNewBookingNotification(
          cita,
          businessOwner.email,
        );
      } catch (emailError) {
        console.error(
          'Fallo el envío de email, pero la cita se creó:',
          emailError,
        );
      }
    }
    return cita;
  }

  // --- ¡NUEVO MÉTODO! ---
  /**
   * Cancela una cita usando el token único.
   */
  async cancelAppointment(token: string) {
    // 1. Buscar la cita por el token
    const cita = await this.prisma.cita.findUnique({
      where: { cancelToken: token },
      include: {
        cliente: true,
        service: true,
        employee: true,
      },
    });

    if (!cita) {
      throw new NotFoundException(
        'Enlace de cancelación no válido o ya utilizado.',
      );
    }

    // 2. Verificar si ya está cancelada o si ya pasó
    if (cita.status === 'CANCELLED') {
      throw new BadRequestException('Esta cita ya ha sido cancelada.');
    }
    if (new Date(cita.startTime) < new Date()) {
      throw new BadRequestException(
        'No puedes cancelar una cita que ya ha pasado.',
      );
    }

    // 3. Actualizar la cita a "CANCELLED"
    const cancelledCita = await this.prisma.cita.update({
      where: { id: cita.id },
      data: {
        status: 'CANCELLED',
      },
      include: {
        cliente: true,
        service: true,
        employee: true,
      },
    });

    // 4. Notificar al cliente (opcional pero recomendado)
    try {
      await this.emailService.sendCancellationConfirmation(cancelledCita);
    } catch (emailError) {
      console.error(
        'Fallo el envío de email de cancelación, pero la cita se canceló:',
        emailError,
      );
    }

    return cancelledCita;
  }
}
