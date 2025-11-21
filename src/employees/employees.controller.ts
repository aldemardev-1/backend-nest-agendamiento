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
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { UpdateAvailabilityDto } from './dto/availability.dto';

// Definimos la interfaz del usuario para no usar 'any' ni tipos incorrectos
interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @GetUser() user: UserPayload, // <-- 1. Usamos la interfaz correcta
  ) {
    // 2. Usamos user.userId en lugar de user.sub
    return this.employeesService.create(createEmployeeDto, user.userId);
  }

  @Get()
  findAll(
    @GetUser() user: UserPayload,
    @Query() queryDto: QueryEmployeeDto,
  ) {
    return this.employeesService.findAll(user.userId, queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string,
    @GetUser() user: UserPayload,
  ) {
    return this.employeesService.findOne(id, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @GetUser() user: UserPayload,
  ) {
    return this.employeesService.update(id, updateEmployeeDto, user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: UserPayload) {
    return this.employeesService.remove(id, user.userId);
  }

  @Get(':id/availability')
  getAvailability(@Param('id') id: string, @GetUser() user: UserPayload) {
    return this.employeesService.getAvailability(id, user.userId);
  }

  @Patch(':id/availability')
  updateAvailability(
    @Param('id') id: string,
    @GetUser() user: UserPayload,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
  ) {
    return this.employeesService.updateAvailability(
      id,
      user.userId,
      updateAvailabilityDto,
    );
  }
}
