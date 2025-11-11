import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config'; // Importar ConfigService

// Este es el payload que DEFINIMOS en el auth.service
// y que está DENTRO del token
type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  ownerId?: string; // (Solo para empleados)
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  // Inyectar ConfigService
  constructor(config: ConfigService) {
    // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---

    // 1. Obtenemos la variable de entorno ANTES de llamar a super()
    const secret = config.get('JWT_SECRET') || '';
    console.log('secret: ', secret);
    // 2. ¡Validación Crítica!
    // Si el .env no tiene JWT_SECRET, la app debe fallar al arrancar.
    // Esto nos da un error claro en lugar del error de TypeScript.
    if (!secret) {
      throw new Error('JWT_SECRET no está definida en el archivo .env. La aplicación no puede arrancar.');
    }

    // 3. Pasamos las opciones a super()
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || '', // <-- Ahora TypeScript sabe que 'secret' SÍ es un string.
    });
  }

  /**
   * NestJS llama a esto DESPUÉS de validar la firma y la expiración.
   * El 'payload' es el token ya decodificado.
   * Lo que retornamos aquí se adjunta a 'request.user'.
   */
  async validate(payload: JwtPayload) {
    // Simplemente devolvemos el payload.
    // Es rápido, seguro, y funciona para todos los roles.
    return payload;
  }
}
