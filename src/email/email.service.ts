import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import {
  Cita,
  Cliente,
  Service,
  Employee,
  Prisma,
} from '@prisma/client';
import { format, add, sub } from 'date-fns';
import { es } from 'date-fns/locale';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service'; // <-- 1. IMPORTAR PRISMA

// Definir la forma de la cita con los includes (¡importante!)
type CitaConDetalles = Cita & {
  cliente: { name: string; email: string | null; phone: string | null };
  service: { name: string; duration: number };
  employee: { name: string };
};

@Injectable()
export class EmailService {
  // --- 2. AÑADIR LOGGER Y PRISMA ---
  private readonly logger = new Logger(EmailService.name);
  constructor(
    private mailerService: MailerService,
    private prisma: PrismaService, // <-- 3. INYECTAR PRISMA
  ) {}

  // --- 4. NUEVA TAREA PROGRAMADA (CRON JOB) ---
  /**
   * Esta función se ejecuta automáticamente cada hora.
   * Busca citas para "mañana" y envía recordatorios.
   */
  @Cron(CronExpression.EVERY_HOUR) // Puedes cambiarlo a EVERY_30_MINUTES si prefieres
  async handleCronSendReminders() {
    this.logger.log('Ejecutando Cron Job: Buscando recordatorios para enviar...');

    // 1. Definir el rango de "Mañana"
    // (Desde mañana a las 00:00 hasta mañana a las 23:59)
    const now = new Date();
    const tomorrowStart = add(now, { days: 1 });
    tomorrowStart.setHours(0, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setHours(23, 59, 59, 999);

    // 2. Buscar citas en ese rango que NO hayan recibido recordatorio
    const citasParaRecordar = await this.prisma.cita.findMany({
      where: {
        startTime: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
        status: 'PENDING', // Solo citas pendientes
        reminderSent: false, // ¡IMPORTANTE! Solo las que no hemos enviado
      },
      include: {
        cliente: true,
        service: true,
        employee: true,
      },
    });

    if (citasParaRecordar.length === 0) {
      this.logger.log('No se encontraron citas para recordar.');
      return;
    }

    this.logger.log(`Se encontraron ${citasParaRecordar.length} citas para recordar.`);

    // 3. Enviar recordatorios y marcar como enviados
    for (const cita of citasParaRecordar) {
      // Usamos 'as any' porque el 'include' nos da los detalles
      try {
        await this.sendReminderEmail(cita as any);
        
        // 4. ¡CRÍTICO! Marcar la cita como enviada
        await this.prisma.cita.update({
          where: { id: cita.id },
          data: { reminderSent: true },
        });

        this.logger.log(`Recordatorio enviado para la cita ${cita.id}`);
      } catch (error) {
        this.logger.error(`Error al enviar recordatorio para la cita ${cita.id}:`, error);
      }
    }
  }

  // --- 5. NUEVA PLANTILLA DE EMAIL (Recordatorio) ---
  /**
   * Envía un email de recordatorio (24h antes) AL CLIENTE.
   */
  async sendReminderEmail(cita: CitaConDetalles) {
    if (!cita.cliente.email) {
      console.warn(`Cliente ${cita.cliente.name} no tiene email, saltando recordatorio.`);
      return;
    }

    const fecha = format(new Date(cita.startTime), "eeee dd 'de' MMMM, yyyy", {
      locale: es,
    });
    const hora = format(new Date(cita.startTime), 'HH:mm');
    const cancelUrl = `http://localhost:5173/cancel/${cita.cancelToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #ffc107; color: #333; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Recordatorio de Cita</h1>
        </div>
        <div style="padding: 30px;">
          <p>Hola <strong>${cita.cliente.name}</strong>,</p>
          <p>Este es un recordatorio amistoso de tu cita programada para <strong>mañana</strong>.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <p><strong>Servicio:</strong> ${cita.service.name}</p>
            <p><strong>Empleado:</strong> ${cita.employee.name}</p>
            <p><strong>Fecha:</strong> <span style="text-transform: capitalize;">${fecha}</span></p>
            <p><strong>Hora:</strong> ${hora}</p>
          </div>
          <p style="margin-top: 25px;">Si ya no puedes asistir, por favor cancela tu cita usando el botón de abajo para liberar el espacio.</p>
          <p style="text-align: center;">
            <a 
              href="${cancelUrl}" 
              style="background-color: #dc3545; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;"
            >
              Cancelar Cita
            </a>
          </p>
        </div>
      </div>
    `;

    await this.mailerService.sendMail({
      to: cita.cliente.email,
      subject: `Recordatorio de tu Cita - Mañana a las ${hora}`,
      html: htmlContent,
    });
  }


  // --- FUNCIONES EXISTENTES (Sin cambios) ---

  /**
   * Envía la confirmación de la cita AL CLIENTE.
   */
  async sendBookingConfirmation(cita: CitaConDetalles) {
    if (!cita.cliente.email) {
      console.warn(
        `Cliente ${cita.cliente.name} no tiene email, saltando confirmación.`,
      );
      return;
    }

    const fecha = format(new Date(cita.startTime), "eeee dd 'de' MMMM, yyyy", {
      locale: es,
    });
    const hora = format(new Date(cita.startTime), 'HH:mm');
    const cancelUrl = `http://localhost:5173/cancel/${cita.cancelToken}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #007bff; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">¡Cita Confirmada!</h1>
        </div>
        <div style="padding: 30px;">
          <p>Hola <strong>${cita.cliente.name}</strong>,</p>
          <p>Tu cita ha sido confirmada con éxito. Aquí están los detalles:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
            <p><strong>Servicio:</strong> ${cita.service.name}</p>
            <p><strong>Empleado:</strong> ${cita.employee.name}</p>
            <p><strong>Fecha:</strong> <span style="text-transform: capitalize;">${fecha}</span></p>
            <p><strong>Hora:</strong> ${hora}</p>
          </div>
          <p style="margin-top: 25px;">Si necesitas cancelar o reprogramar, por favor usa el siguiente enlace:</p>
          <p style="text-align: center;">
            <a 
              href="${cancelUrl}" 
              style="background-color: #dc3545; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;"
            >
              Cancelar Cita
            </a>
          </p>
        </div>
      </div>
    `;

    await this.mailerService.sendMail({
      to: cita.cliente.email,
      subject: 'Confirmación de tu Cita',
      html: htmlContent,
    });
  }

  /**
   * Envía una notificación de nueva reserva AL DUEÑO DEL NEGOCIO.
   */
  async sendNewBookingNotification(
    cita: CitaConDetalles,
    businessOwnerEmail: string,
  ) {
    const fecha = format(new Date(cita.startTime), "eeee dd/MM/yyyy 'a las' HH:mm", {
      locale: es,
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif;">
        <h2>¡Nueva Reserva Recibida!</h2>
        <p>Has recibido una nueva cita a través de tu agenda:</p>
        <ul>
          <li><strong>Cliente:</strong> ${cita.cliente.name}</li>
          <li><strong>Email:</strong> ${cita.cliente.email || 'No proporcionado'}</li>
          <li><strong>Teléfono:</strong> ${cita.cliente.phone || 'No proporcionado'}</li>
          <li><strong>Servicio:</strong> ${cita.service.name}</li>
          <li><strong>Empleado:</strong> ${cita.employee.name}</li>
          <li><strong>Fecha:</strong> ${fecha}</li>
          <li><strong>Notas:</strong> ${cita.notes || 'Ninguna'}</li>
        </ul>
      </div>
    `;

    await this.mailerService.sendMail({
      to: businessOwnerEmail,
      subject: `Nueva Cita Agendada: ${cita.cliente.name} - ${fecha}`,
      html: htmlContent,
    });
  }

  /**
   * Envía la confirmación de cancelación AL CLIENTE.
   */
  async sendCancellationConfirmation(cita: CitaConDetalles) {
    if (!cita.cliente.email) {
      return; // No se puede notificar si no hay email
    }

    const fecha = format(
      new Date(cita.startTime), "eeee dd/MM/yyyy 'a las' HH:mm", {
      locale: es,
    });

    await this.mailerService.sendMail({
      to: cita.cliente.email,
      subject: 'Tu cita ha sido cancelada',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Cita Cancelada</h2>
          <p>Hola <strong>${cita.cliente.name}</strong>,</p>
          <p>Tu cita para <strong>${cita.service.name}</strong> con <strong>${cita.employee.name}</strong> 
             programada para el <strong>${fecha}</strong> ha sido cancelada exitosamente.</p>
        </div>
      `,
    });
  }
}
