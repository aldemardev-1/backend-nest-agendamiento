import { Module } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { ClientesController } from './clientes.controller';
// No necesitas importar PrismaModule aquí si ya está global en app.module.ts

@Module({
  controllers: [ClientesController],
  providers: [ClientesService],
})
export class ClientesModule {}
