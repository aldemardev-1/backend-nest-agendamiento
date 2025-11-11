import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Prisma } from '@prisma/client';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { UpdateAvailabilityDto } from './dto/availability.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  /**
   * CREAR un empleado (para el usuario logueado)
   */
  async create(createEmployeeDto: CreateEmployeeDto, userId: string) {
    // 1. VALIDACIÓN DE PLAN
    const userWithEmployees = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { _count: { select: { employees: true } } },
    });

    if (!userWithEmployees) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (userWithEmployees._count.employees >= userWithEmployees.maxEmployees) {
      throw new ForbiddenException(
        `LÍmite de empleados (${userWithEmployees.maxEmployees}) alcanzado. Por favor, actualiza tu plan.`,
      );
    }

    // 2. Crear el empleado (ASIGNANDO EL userId)
    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.create({
        data: {
          ...createEmployeeDto,
          userId: userId, // <-- ¡LÍNEA DE SEGURIDAD!
        },
      });

      // (Lógica de crear disponibilidad)
      const availabilityData: Prisma.AvailabilityCreateManyInput[] = [];
      for (let i = 0; i < 7; i++) {
        availabilityData.push({
          employeeId: employee.id,
          dayOfWeek: i,
          isAvailable: false,
          startTime: null,
          endTime: null,
        });
      }
      await tx.availability.createMany({ data: availabilityData });

      return employee;
    });
  }

  /**
   * OBTENER TODOS los empleados (del usuario logueado)
   */
  async findAll(userId: string, queryDto: QueryEmployeeDto) {
    const { page = 1, limit = 10, search } = queryDto;
    const skip = (page - 1) * Number(limit);

    const whereClause: Prisma.EmployeeWhereInput = {
      userId: userId, // <-- ¡LÍNEA DE SEGURIDAD CLAVE!
    };

    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    const [employees, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        orderBy: { name: 'asc' },
      }),
      this.prisma.employee.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));
    return {
      data: employees,
      meta: { totalItems: total, currentPage: Number(page), totalPages, itemsPerPage: Number(limit) },
    };
  }

  /**
   * OBTENER UN empleado (del usuario logueado)
   */
  async findOne(id: string, userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: id },
    });

    if (!employee) {
      throw new NotFoundException('Empleado no encontrado');
    }
    // ¡LÍNEA DE SEGURIDAD CLAVE!
    if (employee.userId !== userId) {
      throw new ForbiddenException('No tienes permiso para ver este empleado');
    }
    return employee;
  }

  /**
   * ACTUALIZAR un empleado (del usuario logueado)
   */
  async update(id: string, updateEmployeeDto: UpdateEmployeeDto, userId: string) {
    // 1. Validar que el empleado existe y pertenece al usuario
    await this.findOne(id, userId);
    
    // 2. Actualizar
    return this.prisma.employee.update({
      where: { id: id },
      data: updateEmployeeDto,
    });
  }

  /**
   * ELIMINAR un empleado (del usuario logueado)
   */
  async remove(id: string, userId: string) {
    // 1. Validar que el empleado existe y pertenece al usuario
    await this.findOne(id, userId);
    // 2. Eliminar
    return this.prisma.employee.delete({
      where: { id: id },
    });
  }

  // --- (Funciones de Availability) ---
  // Estas ya están seguras porque usan findOne(employeeId, userId)
  async getAvailability(employeeId: string, userId: string) {
    await this.findOne(employeeId, userId); // <-- Validación
    return this.prisma.availability.findMany({
      where: { employeeId: employeeId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async updateAvailability(
    employeeId: string,
    userId: string,
    dto: UpdateAvailabilityDto,
  ) {
    await this.findOne(employeeId, userId); // <-- Validación

    return this.prisma.$transaction(async (tx) => {
      const updatePromises: Prisma.PrismaPromise<any>[] = [];
      for (const slot of dto.availability) {
        const promise = tx.availability.update({
          where: {
            employeeId_dayOfWeek: {
              employeeId: employeeId,
              dayOfWeek: slot.dayOfWeek,
            },
          },
          data: {
            isAvailable: slot.isAvailable,
            startTime: slot.isAvailable ? slot.startTime : null,
            endTime: slot.isAvailable ? slot.endTime : null,
          },
        });
        updatePromises.push(promise);
      }
      return Promise.all(updatePromises);
    });
  }
}
