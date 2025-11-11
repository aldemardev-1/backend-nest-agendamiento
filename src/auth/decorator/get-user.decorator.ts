import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Este es el payload que nuestro JwtStrategy (corregido) devuelve
type JwtPayloadWithRole = {
  sub: string;
  email: string;
  role: string;
  ownerId?: string;
};

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayloadWithRole => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
