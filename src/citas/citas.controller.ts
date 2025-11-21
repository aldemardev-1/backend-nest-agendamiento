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
import { CitasService } from './citas.service';
import { CreateCitaDto } from './dto/create-cita.dto';
import { UpdateCitaDto } from './dto/update-cita.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorator/get-user.decorator'; // <-- 1. IMPORTAR
import { QueryCitaDto } from './dto/query-cita.dto';

interface UserPayload {
  userId: string;
  email: string;
  role: string;
}
@UseGuards(AuthGuard('jwt'))
@Controller('citas')
export class CitasController {
  constructor(private readonly citasService: CitasService) {}

  // --- ¡CORREGIDO! ---
  @Post()
  create(
    @Body() createCitaDto: CreateCitaDto,
    @GetUser() user: UserPayload, // <-- 2. Obtener User
  ) {
    return this.citasService.create(createCitaDto, user.userId);
  }

  // --- ¡CORREGIDO! ---
  @Get()
  findAll(
    @GetUser() user: { sub: string }, // <-- 2. Obtener User
    @Query() queryDto: QueryCitaDto,
  ) {
    return this.citasService.findAll(user.sub, queryDto);
  }

  // --- ¡CORREGIDO! ---
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser() user: { sub: string }, // <-- 2. Obtener User
  ) {
    return this.citasService.findOne(id, user.sub);
  }

  // --- ¡CORREGIDO! ---
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCitaDto: UpdateCitaDto,
    @GetUser() user: { sub: string }, // <-- 2. Obtener User
  ) {
    return this.citasService.update(id, updateCitaDto, user.sub);
  }

  // --- ¡CORREGIDO! ---
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser() user: { sub: string }, // <-- 2. Obtener User
  ) {
    return this.citasService.remove(id, user.sub);
  }
}
