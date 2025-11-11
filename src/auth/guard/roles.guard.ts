import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Obtener los roles requeridos (ej. ['SUPER_ADMIN'])
    //    que pusimos en el controlador con @Roles(...)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 2. Si el endpoint no tiene @Roles(), se deja pasar
    if (!requiredRoles) {
      return true;
    }

    // 3. Obtener el 'user' del token (que JwtStrategy adjuntó)
    const { user } = context.switchToHttp().getRequest();

    // 4. Comprobar si el rol del usuario está en la lista de roles requeridos
    return requiredRoles.some((role) => user.role === role);
  }
}
