import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { CreatePaymentLinkDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * [PROTEGIDO - Owner]
   * Crea un enlace de pago de Wompi para que el usuario pague su plan.
   * @route POST /payments/create-link
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('create-link')
  createPaymentLink(
    @GetUser() user: { sub: string }, // Obtenemos el userId del token
    @Body() dto: CreatePaymentLinkDto,
  ) {
    return this.paymentsService.createPaymentLink(user.sub, dto);
  }

  /**
   * [PÚBLICO - Webhook de Wompi]
   * Wompi llama a este endpoint cuando el estado del pago cambia.
   * @route POST /payments/webhook/wompi
   */
  @Post('webhook/wompi')
  @HttpCode(200) // Responder 200 OK a Wompi
  handleWompiWebhook(@Body() data: any) {
    // (En producción, deberías validar la firma del webhook aquí)
    return this.paymentsService.handleWompiWebhook(data);
  }
}
