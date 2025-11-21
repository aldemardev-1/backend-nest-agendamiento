import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfWeek,
  endOfWeek,
  format,
} from 'date-fns';
import { es } from 'date-fns/locale';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(userId: string) {
    const now = new Date();

    // 1. Fechas Clave
    const startCurrentMonth = startOfMonth(now);
    const endCurrentMonth = endOfMonth(now);
    const startLastMonth = startOfMonth(subMonths(now, 1));
    const endLastMonth = endOfMonth(subMonths(now, 1));

    // 2. Consultar Citas de ESTE mes
    // Nota: Incluimos CONFIRMED y COMPLETED. Ignoramos PENDING o CANCELLED para el dinero real.
    const currentMonthCitas = await this.prisma.cita.findMany({
      where: {
        userId,
        startTime: { gte: startCurrentMonth, lte: endCurrentMonth },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      include: { service: true },
    });

    // 3. Consultar Citas del mes PASADO (Para comparar)
    const lastMonthCitas = await this.prisma.cita.findMany({
      where: {
        userId,
        startTime: { gte: startLastMonth, lte: endLastMonth },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      include: { service: true },
    });

    // 4. Calcular Totales
    const currentIncome = currentMonthCitas.reduce(
      (sum, cita) => sum + (cita.service?.price || 0),
      0,
    );
    const lastIncome = lastMonthCitas.reduce(
      (sum, cita) => sum + (cita.service?.price || 0),
      0,
    );

    // 5. Calcular Porcentaje de Crecimiento
    let growthPercentage = 0;
    if (lastIncome > 0) {
      growthPercentage = ((currentIncome - lastIncome) / lastIncome) * 100;
    } else if (currentIncome > 0) {
      growthPercentage = 100; // Si antes era 0 y ahora ganaste, creciste 100% (técnicamente infinito, pero 100 se ve mejor)
    }

    // 6. Datos para la Gráfica (Ingresos por día de la semana actual)
    const startCurrentWeek = startOfWeek(now, { locale: es });
    const endCurrentWeek = endOfWeek(now, { locale: es });

    const weekCitas = await this.prisma.cita.findMany({
      where: {
        userId,
        startTime: { gte: startCurrentWeek, lte: endCurrentWeek },
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      include: { service: true },
    });

    // Agrupar por día (Lun, Mar, etc.)
    const daysMap = new Map<string, number>();
    // Inicializar días en 0
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startCurrentWeek);
      dayDate.setDate(dayDate.getDate() + i);
      // Clave ej: "lunes", "martes"
      const dayName = format(dayDate, 'eeee', { locale: es });
      daysMap.set(dayName, 0);
    }

    weekCitas.forEach((cita) => {
      const dayName = format(new Date(cita.startTime), 'eeee', { locale: es });
      const current = daysMap.get(dayName) || 0;
      daysMap.set(dayName, current + (cita.service?.price || 0));
    });

    // Convertir a array para el frontend
    const chartData = Array.from(daysMap.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1), // Capitalizar: "Lunes"
      total: value,
    }));

    return {
      income: {
        current: currentIncome,
        last: lastIncome,
        growth: Math.round(growthPercentage),
      },
      totalAppts: currentMonthCitas.length,
      chartData,
    };
  }
}
