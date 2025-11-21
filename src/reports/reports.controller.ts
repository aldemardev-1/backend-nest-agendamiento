import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
// import { JwtAuthGuard } from './auth/jwt-auth.guard'; // Asegúrate de importar tu Guard

@Controller('reports')
@UseGuards(JwtAuthGuard) // Protegido: Solo usuarios logueados
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard-stats')
  async getDashboardStats(@Request() req) {
    // El ID del usuario viene del token JWT (req.user.userId o req.user.sub)
    return this.reportsService.getDashboardStats(req.user.userId);
  }
}
