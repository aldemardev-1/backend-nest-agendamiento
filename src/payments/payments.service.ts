import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { CreatePaymentLinkDto } from './dto/create-payment.dto';
import { firstValueFrom } from 'rxjs';
import { EmailService } from 'src/email/email.service';

// Precios de los planes (en centavos de COP)
const PLAN_PRICES = {
  PROFESIONAL: 4990000, // 49.900 COP
  EMPRESA: 9990000, // 99.900 COP
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly wompiSecret: string;
  private readonly wompiBaseUrl = 'https://api.wompi.co/v1';

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private httpService: HttpService,
    private emailService: EmailService,
  ) {
    // Cargar la llave privada (secreta) de Wompi
    this.wompiSecret = this.config.get('WOMPI_PRIVATE_KEY') || '';
    if (!this.wompiSecret) {
      throw new Error('WOMPI_PRIVATE_KEY no está definida en .env');
    }
  }

  /**
   * 1. Creación del Enlace de Pago
   * (Llamado por el "Owner" desde su dashboard)
   */
  async createPaymentLink(userId: string, dto: CreatePaymentLinkDto) {
    const { plan } = dto;
    const amountInCents = PLAN_PRICES[plan];
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // 1. Generar la referencia única
    const reference = `plan_${plan}_${userId}_${Date.now()}`;

    // 2. Crear el registro de pago en nuestra DB (como PENDING)
    await this.prisma.payment.create({
      data: {
        amount: amountInCents / 100, // Guardar en pesos (ej. 49900)
        reference: reference,
        status: 'PENDING',
        userId: userId,
      },
    });

    // 3. Crear el "Link de Pago" en Wompi
    try {
      const wompiPayload = {
        name: `Suscripción Plan ${plan} - ${user.businessName}`,
        description: `Pago mensualidad Plan ${plan}`,
        single_use: true, // El enlace solo sirve una vez
        collect_shipping: false,
        amount_in_cents: amountInCents,
        currency: 'COP',
        customer_email: user.email,
        redirect_url: `http://localhost:5173/dashboard/billing/confirm`, // URL de tu frontend
        reference: reference,
      };

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.wompiBaseUrl}/payment_links`,
          wompiPayload,
          {
            headers: {
              Authorization: `Bearer ${this.wompiSecret}`,
            },
          },
        ),
      );

      // 4. Devolver la URL de pago al frontend
      return { paymentUrl: response.data.data.url };
    } catch (error) {
      this.logger.error(
        'Error al crear link de pago en Wompi:',
        error.response?.data,
      );
      throw new InternalServerErrorException(
        'Error al contactar la pasarela de pagos.',
      );
    }
  }

  /**
   * 2. Manejador de Webhook
   * (Llamado por el servidor de Wompi cuando el pago cambia)
   */
  async handleWompiWebhook(data: any) {
    this.logger.log('Webhook de Wompi recibido:', data.event);

    // Extraer la información relevante
    const wompiTransaction = data?.data?.transaction;
    if (!wompiTransaction) {
      return { message: 'No hay datos de transacción.' };
    }

    const reference = wompiTransaction.reference;
    const wompiId = wompiTransaction.id;
    const wompiStatus = wompiTransaction.status; // 'APPROVED', 'DECLINED', 'VOIDED'

    // 1. Buscar el pago en nuestra DB
    const payment = await this.prisma.payment.findUnique({
      where: { reference },
      include: { user: true },
    });

    if (!payment) {
      this.logger.error(`Webhook ignorado: No se encontró la referencia ${reference}.`);
      return { message: 'Referencia no encontrada.' };
    }

    // 2. Si el pago ya fue procesado, no hacer nada
    if (payment.status === 'COMPLETED' || payment.status === 'FAILED') {
      this.logger.warn(`Webhook ignorado: El pago ${reference} ya fue procesado.`);
      return { message: 'Pago ya procesado.' };
    }

    // 3. ¡El pago fue EXITOSO!
    if (wompiStatus === 'APPROVED') {
      this.logger.log(`¡Pago APROBADO para ${reference}!`);

      // 3a. Determinar el plan basado en el monto
      let plan = 'GRATIS';
      let maxEmployees = 1;
      let planExpiresAt = new Date(); // (Hoy)

      if (payment.amount === 49900) { // Profesional
        plan = 'PROFESIONAL';
        maxEmployees = 5;
      } else if (payment.amount === 99900) { // Empresa
        plan = 'EMPRESA';
        maxEmployees = 9999;
      }
      
      // Dar 30 días de servicio
      planExpiresAt.setDate(planExpiresAt.getDate() + 30); 

      // 3b. Actualizar nuestra DB (¡en una transacción!)
      try {
        await this.prisma.$transaction([
          // Actualizar el Pago
          this.prisma.payment.update({
            where: { reference },
            data: {
              status: 'COMPLETED',
              wompiId: wompiId,
            },
          }),
          // Actualizar al Usuario
          this.prisma.user.update({
            where: { id: payment.userId },
            data: {
              plan: plan,
              maxEmployees: maxEmployees,
              maxServices: 9999, // Servicios ilimitados en planes pagos
              planExpiresAt: planExpiresAt,
            },
          }),
        ]);

        // 3c. Enviar email de confirmación
        await this.emailService.sendPaymentSuccess(payment.user, payment, plan);
        
      } catch (error) {
        this.logger.error(`Error al actualizar DB tras pago ${reference}:`, error);
        throw new InternalServerErrorException('Error al actualizar la base de datos.');
      }
    }
    // 4. El pago falló
    else {
      this.logger.warn(`Pago ${wompiStatus} para ${reference}.`);
      await this.prisma.payment.update({
        where: { reference },
        data: {
          status: 'FAILED',
          wompiId: wompiId,
        },
      });
    }

    return { message: 'Webhook procesado exitosamente.' };
  }
}