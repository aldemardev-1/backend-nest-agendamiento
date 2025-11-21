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
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import { QueryServiceDto } from './dto/query-service.dto';

// Definimos la interfaz correcta (igual que en EmployeesController)
interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

@UseGuards(AuthGuard('jwt'))
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(
    @Body() createServiceDto: CreateServiceDto,
    @GetUser() user: UserPayload, // <-- 1. Usamos la interfaz correcta
  ) {
    // 2. Usamos user.userId (NO user.sub)
    return this.servicesService.create(createServiceDto, user.userId);
  }

  @Get()
  findAll(
    @Query() query: QueryServiceDto,
    @GetUser() user: UserPayload,
  ) {
    return this.servicesService.findAll(user.userId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: UserPayload) {
    return this.servicesService.findOne(id, user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @GetUser() user: UserPayload,
  ) {
    return this.servicesService.update(id, updateServiceDto, user.userId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser() user: UserPayload,
  ) {
    return this.servicesService.remove(id, user.userId);
  }
}