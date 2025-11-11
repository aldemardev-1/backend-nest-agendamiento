import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // <-- ¡Importante!
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // <-- ¡Importante!
})
export class PrismaModule {}
