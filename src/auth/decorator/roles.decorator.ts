import { SetMetadata } from '@nestjs/common';

// Esta es la clave que usaremos para 'pegar' los roles
export const ROLES_KEY = 'roles';

// Este es el decorador @Roles('SUPER_ADMIN')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
