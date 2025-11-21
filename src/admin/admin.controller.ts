import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Query, // <-- 1. IMPORTAR
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { AdminService } from './admin.service';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AdminQueryDto } from './dto/admin-query.dto'; // <-- 2. IMPORTAR

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // 1. Dashboard Stats (NUEVO)
  @Get('stats')
  getStats() {
    return this.adminService.getGlobalStats();
  }

  /**
   * [Super Admin] Obtiene la lista de todos los negocios (PAGINADO)
   * @route GET /admin/businesses
   */
  @Get('businesses')
  getBusinesses(@Query() query: AdminQueryDto) {
    return this.adminService.getBusinesses(query);
  }

  /**
   * [Super Admin] Actualiza el plan de un negocio
   * @route PATCH /admin/businesses/:id/plan
   * (Este método no cambia)
   */
  @Patch('businesses/:id/plan')
  updateBusinessPlan(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ) {
    return this.adminService.updateBusinessPlan(id, updatePlanDto);
  }
}
