import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  /**
   * CREAR un servicio (para el usuario logueado)
   */
  async create(createServiceDto: CreateServiceDto, userId: string) {
    // 1. VALIDACIÓN DE PLAN
    const userWithServices = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { services: true } } },
    });

    if (!userWithServices) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (userWithServices._count.services >= userWithServices.maxServices) {
      throw new ForbiddenException(
        `Límite de servicios (${userWithServices.maxServices}) alcanzado. Por favor, actualiza tu plan.`,
      );
    }
    
    // 2. Crear el servicio (ASIGNANDO EL userId)
    return this.prisma.service.create({
      data: {
        ...createServiceDto,
        userId: userId, // <-- ¡LÍNEA DE SEGURIDAD!
      },
    });
  }

  /**
   * OBTENER TODOS los servicios (del usuario logueado)
   */
  async findAll(userId: string, queryDto: QueryServiceDto) {
    const { page = 1, limit = 10, search } = queryDto;
    const skip = (page - 1) * Number(limit);

    const whereClause: Prisma.ServiceWhereInput = {
      userId: userId, // <-- ¡LÍNEA DE SEGURIDAD CLAVE!
    };

    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    const [services, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
      }),
      this.prisma.service.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));
    return {
      data: services,
      meta: { totalItems: total, currentPage: Number(page), totalPages, itemsPerPage: Number(limit) },
    };
  }

  /**
   * OBTENER UN servicio (del usuario logueado)
   */
  async findOne(id: string, userId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: id },
    });

    if (!service) {
      throw new NotFoundException('Servicio no encontrado');
    }
    // ¡LÍNEA DE SEGURIDAD CLAVE!
    if (service.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver este servicio');
    }
    return service;
  }

  /**
   * ACTUALIZAR un servicio (del usuario logueado)
   */
  async update(id: string, updateServiceDto: UpdateServiceDto, userId: string) {
    // 1. Validar que el servicio existe y pertenece al usuario
    await this.findOne(id, userId);
    // 2. Actualizar
    return this.prisma.service.update({
      where: { id: id },
      data: updateServiceDto,
    });
  }

  /**
   * ELIMINAR un servicio (del usuario logueado)
   */
  async remove(id: string, userId: string) {
    // 1. Validar que el servicio existe y pertenece al usuario
    await this.findOne(id, userId);
    // 2. Eliminar
    return this.prisma.service.delete({
      where: { id: id },
    });
  }
}
