import { Module } from '@nestjs/common';
import { CitasController } from './citas.controller';
import { CitasService } from './citas.service';
import { PublicModule } from 'src/public/public.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [PublicModule, EmailModule],
  controllers: [CitasController],
  providers: [CitasService],
})
export class CitasModule {}
