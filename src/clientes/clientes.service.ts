import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Prisma } from '@prisma/client';
import { QueryClienteDto } from './dto/query-cliente.dto';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  /**
   * CREAR un cliente (para el usuario logueado)
   */
  async create(createClienteDto: CreateClienteDto, userId: string) {
    return this.prisma.cliente.create({
      data: {
        ...createClienteDto,
        userId: userId, // <-- ¡LÍNEA DE SEGURIDAD!
      },
    });
  }

  /**
   * OBTENER TODOS los clientes (del usuario logueado)
   */
  async findAll(userId: string, queryDto: QueryClienteDto) {
    const { page = 1, limit = 10, search } = queryDto;
    const skip = (page - 1) * Number(limit);

    const whereClause: Prisma.ClienteWhereInput = {
      userId: userId, // <-- ¡LÍNEA DE SEGURIDAD CLAVE!
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clientes, total] = await this.prisma.$transaction([
      this.prisma.cliente.findMany({
        where: whereClause,
        skip: skip,
        take: Number(limit),
        orderBy: {
          name: 'asc',
        },
      }),
      this.prisma.cliente.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    return {
      data: clientes,
      meta: {
        totalItems: total,
        currentPage: Number(page),
        totalPages: totalPages,
        itemsPerPage: Number(limit),
      },
    };
  }

  /**
   * OBTENER UN cliente (del usuario logueado)
   */
  async findOne(id: string, userId: string) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: id },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }
    // ¡LÍNEA DE SEGURIDAD CLAVE!
    if (cliente.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para ver este cliente',
      );
    }
    return cliente;
  }

  /**
   * ACTUALIZAR un cliente (del usuario logueado)
   */
  async update(
    id: string,
    updateClienteDto: UpdateClienteDto,
    userId: string,
  ) {
    // 1. Validar que el cliente existe y pertenece al usuario
    await this.findOne(id, userId);
    // 2. Actualizar el cliente
    return this.prisma.cliente.update({
      where: { id: id },
      data: updateClienteDto,
    });
  }

  /**
   * ELIMINAR un cliente (del usuario logueado)
   */
  async remove(id: string, userId: string) {
    // 1. Validar que el cliente existe y pertenece al usuario
    await this.findOne(id, userId);
    // 2. Eliminar el cliente
    return this.prisma.cliente.delete({
      where: { id: id },
    });
  }
}
