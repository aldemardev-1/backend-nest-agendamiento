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
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorator/get-user.decorator'; // <-- 1. IMPORTAR
import { QueryServiceDto } from './dto/query-service.dto';

@UseGuards(AuthGuard('jwt')) // <-- Proteger todo el controlador
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // --- ¡CORREGIDO! ---
  @Post()
  create(
    @Body() createServiceDto: CreateServiceDto,
    @GetUser() user: { sub: string }, // <-- 2. Obtener el User del token
  ) {
    // 3. Pasar el ID del usuario (user.sub) al servicio
    return this.servicesService.create(createServiceDto, user.sub);
  }

  // --- ¡CORREGIDO! ---
  @Get()
  findAll(
    @Query() query: QueryServiceDto,
    @GetUser() user: { sub: string }, // <-- 2. Obtener el User
  ) {
    // 3. Pasar el ID del usuario
    return this.servicesService.findAll(user.sub, query);
  }

  // --- ¡CORREGIDO! ---
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser() user: { sub: string }, // <-- 2. Obtener el User
  ) {
    // 3. Pasar el ID del usuario
    return this.servicesService.findOne(id, user.sub);
  }

  // --- ¡CORREGIDO! ---
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @GetUser() user: { sub: string }, // <-- 2. Obtener el User
  ) {
    // 3. Pasar el ID del usuario
    return this.servicesService.update(id, updateServiceDto, user.sub);
  }

  // --- ¡CORREGIDO! ---
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser() user: { sub: string }, // <-- 2. Obtener el User
  ) {
    // 3. Pasar el ID del usuario
    return this.servicesService.remove(id, user.sub);
  }
}
