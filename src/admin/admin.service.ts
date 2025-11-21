import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AdminQueryDto } from './dto/admin-query.dto';
import { Plan, Prisma } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}
  private readonly logger = new Logger(AdminService.name);

  /**
   * Obtiene todos los usuarios que son 'OWNER' (PAGINADO)
   */
  async getBusinesses(queryDto: AdminQueryDto) {
    const { page = 1, limit = 10, search } = queryDto;
    const skip = (page - 1) * Number(limit);

    const whereClause: Prisma.UserWhereInput = {
      role: 'OWNER',
    };

    if (search) {
      whereClause.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [businesses, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: whereClause,
        skip: skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
        // Omitir el password de la respuesta
        select: {
          id: true,
          email: true,
          businessName: true,
          createdAt: true,
          role: true,
          plan: true,
          maxEmployees: true,
          maxServices: true,
          planExpiresAt: true, // <-- ¡AÑADIDO!
          _count: {
            select: {
              employees: true,
              services: true,
              clientes: true,
              citas: true,
            },
          },
        },
      }),
      this.prisma.user.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    return {
      data: businesses,
      meta: {
        totalItems: total,
        currentPage: Number(page),
        totalPages: totalPages,
        itemsPerPage: Number(limit),
      },
    };
  }

  /**
   * Actualiza el plan de un negocio específico
   */
  async updateBusinessPlan(userId: string, dto: UpdatePlanDto) {
    let maxEmployees = 1;
    let maxServices = 1;
    let planExpiresAt: Date | null = null;

    if (dto.plan === 'PROFESIONAL') {
      maxEmployees = 5;
      maxServices = 9999;
      const now = new Date();
      planExpiresAt = new Date(now.setDate(now.getDate() + 30));
    } else if (dto.plan === 'EMPRESA') {
      maxEmployees = 9999;
      maxServices = 9999;
      const now = new Date();
      planExpiresAt = new Date(now.setDate(now.getDate() + 30));
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        plan: dto.plan as Plan,
        maxEmployees: maxEmployees,
        maxServices: maxServices,
        planExpiresAt: planExpiresAt,
      },
    });
  }

  /**
   * Cron Job para revertir planes expirados
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleExpiredPlans() {
    this.logger.log('Ejecutando Cron Job: Verificando planes expirados...');
    const now = new Date();

    const expiredUsers = await this.prisma.user.findMany({
      where: {
        role: 'OWNER',
        plan: { not: Plan.FREE },
        planExpiresAt: {
          lte: now,
        },
      },
    });

    if (expiredUsers.length === 0) {
      this.logger.log('No se encontraron planes expirados.');
      return;
    }

    this.logger.log(`¡Se encontraron ${expiredUsers.length} planes expirados!`);

    for (const user of expiredUsers) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          plan: Plan.FREE,
          maxEmployees: 1,
          maxServices: 1,
          planExpiresAt: null,
        },
      });
      this.logger.log(`Plan de ${user.email} revertido a GRATIS.`);
    }
  }

  async getGlobalStats() {
    // Total Negocios
    const totalBusinesses = await this.prisma.user.count({
      where: { role: 'OWNER' },
    });

    // Total Citas (Métrica de uso global de tu plataforma)
    const totalCitas = await this.prisma.cita.count();

    // MRR (Ingresos Mensuales Recurrentes)
    // Sumamos todos los pagos completados del mes actual (o histórico si prefieres)
    // Por ahora, sumemos todo el historial de la tabla Payment
    const payments = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'COMPLETED' }, // Solo pagos reales
    });

    return {
      totalBusinesses,
      totalCitas, // Usaremos "Citas Totales" en lugar de "Usuarios" porque es más relevante para el SaaS
      mrr: payments._sum.amount || 0,
    };
  }
}
