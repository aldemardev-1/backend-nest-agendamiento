import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorator/get-user.decorator'; // <-- 1. IMPORTAR
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { UpdateAvailabilityDto } from './dto/availability.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  // --- ¡CORREGIDO! ---
  @Post()
  create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @GetUser() user: { sub: string }, // <-- 2. Obtener User
  ) {
    // 3. Pasar user.sub (userId)
    return this.employeesService.create(createEmployeeDto, user.sub);
  }

  // --- ¡CORREGIDO! ---
  @Get()
  findAll(
    @GetUser() user: { sub: string }, // <-- 2. Obtener User
    @Query() queryDto: QueryEmployeeDto,
  ) {
    // 3. Pasar user.sub (userId)
    return this.employeesService.findAll(user.sub, queryDto);
  }

  // --- ¡CORREGIDO! ---
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser() user: { sub: string }, // <-- 2. Obtener User
  ) {
    return this.employeesService.findOne(id, user.sub);
  }

  // --- ¡CORREGIDO! ---
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @GetUser() user: { sub: string }, // <-- 2. Obtener User
  ) {
    return this.employeesService.update(id, updateEmployeeDto, user.sub);
  }

  // --- ¡CORREGIDO! ---
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser() user: { sub: string }, // <-- 2. Obtener User
  ) {
    return this.employeesService.remove(id, user.sub);
  }

  // --- (Estos ya estaban bien porque pasaban el userId) ---
  @Get(':id/availability')
  getAvailability(@Param('id') id: string, @GetUser() user: { sub: string }) {
    return this.employeesService.getAvailability(id, user.sub);
  }

  @Patch(':id/availability')
  updateAvailability(
    @Param('id') id: string,
    @GetUser() user: { sub: string },
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    return this.employeesService.updateAvailability(
      id,
      user.sub,
      updateAvailabilityDto,
    );
  }
}
