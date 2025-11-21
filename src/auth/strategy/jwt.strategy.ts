import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

// Definimos la interfaz para evitar 'any'
export interface PayloadToken {
  sub: string;
  email: string;
  role: string;
  name: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: PayloadToken) {

    if (!payload.sub) {
      throw new UnauthorizedException('Token inválido: falta el ID (sub)');
    }

    // Retornamos el objeto que se inyectará en 'req.user'
    return {
      userId: payload.sub, // Aquí mapeamos 'sub' a 'userId'
      email: payload.email,
      role: payload.role,
      businessName: payload.name,
    };
  }
}
