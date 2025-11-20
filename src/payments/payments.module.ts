import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { HttpModule } from '@nestjs/axios'; // <-- 1. Importar HttpModule
import { EmailModule } from 'src/email/email.module'; // <-- 2. Importar EmailModule

@Module({
  imports: [
    HttpModule, // <-- 3. Añadir HttpModule
    EmailModule, // <-- 4. Añadir EmailModule
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
