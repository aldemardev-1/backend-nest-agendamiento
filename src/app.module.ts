import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module'; // <-- AuthModule sigue aquí
import { ServicesModule } from './services/services.module';
import { EmployeesModule } from './employees/employees.module';
import { ClientesModule } from './clientes/clientes.module';
import { CitasModule } from './citas/citas.module';
import { ConfigModule } from '@nestjs/config'; // No necesitas ConfigService aquí
import { PublicModule } from './public/public.module';
import { EmailModule } from './email/email.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';
// ¡Ya no importamos JwtModule ni ConfigService aquí!

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // ¡YA NO NECESITAMOS JwtModule.registerAsync AQUÍ!
    // Lo movimos a AuthModule.
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule, // <-- AuthModule (que ahora es Global)
    ServicesModule,
    EmployeesModule,
    ClientesModule,
    CitasModule,
    PublicModule,
    EmailModule,
    AdminModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
