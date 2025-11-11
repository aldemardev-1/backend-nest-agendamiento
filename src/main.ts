// En backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // <-- Importar

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para que el Frontend se conecte
  app.enableCors();

  // Usar 'class-validator' globalmente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Ignora data que no esté en el DTO
      transform: true,
      forbidNonWhitelisted: true, // Lanza error si llega data extra
    }),
  );

  await app.listen(3001); // <-- Correremos el backend en el puerto 3001
}
bootstrap();
