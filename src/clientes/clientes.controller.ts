import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query, // <-- Importar Query
} from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from 'src/auth/decorator/get-user.decorator'; // <-- 1. IMPORTAR
import { QueryClienteDto } from './dto/query-cliente.dto'; // <-- Importar DTO

interface UserPayload {
  userId: string;
  email: string;
  role: string;
}
@UseGuards(AuthGuard('jwt'))
@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  // --- ¡CORREGIDO! ---
  @Post()
  create(
    @Body() createClienteDto: CreateClienteDto,
    @GetUser() user: UserPayload, // <-- 2. Obtener User
  ) {
    return this.clientesService.create(createClienteDto, user.userId);
  }

  // --- ¡CORREGIDO! ---
  @Get()
  findAll(
    @GetUser() user: { sub: string }, // <-- 2. Obtener User
    @Query() queryDto: QueryClienteDto, // <-- Recibir Query
  ) {
    return this.clientesService.findAll(user.sub, queryDto);
  }

  // --- ¡CORREGIDO! ---
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser() user: { sub: string }, // <-- 2. Obtener User
  ) {
    return this.clientesService.findOne(id, user.sub);
  }

  // --- ¡CORREGIDO! ---
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateClienteDto: UpdateClienteDto,
    @GetUser() user: { sub: string }, // <-- 2. Obtener User
  ) {
    return this.clientesService.update(id, updateClienteDto, user.sub);
  }

  // --- ¡CORREGIDO! ---
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser() user: { sub: string }, // <-- 2. Obtener User
  ) {
    return this.clientesService.remove(id, user.sub);
  }
}
