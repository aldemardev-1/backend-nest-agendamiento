import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailService } from './email.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule], // Importar ConfigModule para usar variables de entorno
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // --- Configuración para Gmail (Ideal para Pruebas) ---
        // Asegúrate de añadir estas variables a tu archivo .env
        transport: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true, // true para 465, false para otros puertos
          auth: {
            user: configService.get<string>('EMAIL_USER'), // ej: tu-correo@gmail.com
            pass: configService.get<string>('EMAIL_PASSWORD'), // ¡OJO! Es una "Contraseña de Aplicación", no tu contraseña real de Gmail
          },
        },
        defaults: {
          from: '"Tu Agenda App" <no-reply@tuagenda.com>',
        },
        // --- Aquí irían las plantillas Handlebars (próximo paso) ---
      }),
    }),
  ],
  providers: [EmailService],
  exports: [EmailService], // ¡Importante! Para que otros módulos puedan usarlo
})
export class EmailModule {}

