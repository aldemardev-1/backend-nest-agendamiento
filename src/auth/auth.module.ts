import { Module, Global } from '@nestjs/common'; // <-- 1. Importar 'Global'
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategy/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

@Global() // <-- 2. ¡HACER EL MÓDULO GLOBAL!
@Module({
  imports: [
    // 3. Traer PassportModule
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // 4. Mover el JwtModule.registerAsync aquí
    JwtModule.registerAsync({
      imports: [ConfigModule], // Asegurarse de que ConfigService esté disponible
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // El JwtStrategy se provee aquí
  exports: [JwtStrategy, PassportModule], // 5. Exportar para que los Guards funcionen
})
export class AuthModule {}
