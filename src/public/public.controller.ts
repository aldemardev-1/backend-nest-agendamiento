import {
  Controller,
  Get,
  Query,
  Param,
  NotFoundException,
  Post,
  Body,
  Patch,
} from '@nestjs/common';
import { PublicService } from './public.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { PublicBookingDto } from './dto/public-booking.dto'; // <-- 1. IMPORTAR

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('availability')
  getAvailability(@Query() query: AvailabilityQueryDto) {
    return this.publicService.getAvailability(query);
  }

  @Get('services/:userId')
  getServices(@Param('userId') userId: string) {
    if (!userId) {
      throw new NotFoundException('UserID no proporcionado');
    }
    return this.publicService.getServicesByUserId(userId);
  }

  @Get('employees/:userId')
  getEmployees(@Param('userId') userId: string) {
    if (!userId) {
      throw new NotFoundException('UserID no proporcionado');
    }
    return this.publicService.getEmployeesByUserId(userId);
  }

  // --- ¡NUEVO! ENDPOINT PARA CREAR LA CITA PÚBLICAMENTE ---
  /**
   * Endpoint público para crear una cita (reservar).
   * @route POST /public/book
   */
  @Post('book')
  bookAppointment(@Body() dto: PublicBookingDto) {
    // El DTO valida automáticamente el body
    return this.publicService.bookAppointment(dto);
  }

  // @route PATCH /public/cancel/:token
  @Patch('cancel/:token')
  cancelAppointment(@Param('token') token: string) {
    return this.publicService.cancelAppointment(token);
  }
}
