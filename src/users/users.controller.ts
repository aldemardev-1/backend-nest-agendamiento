import {
  Controller,
  Get,
  Body,
  Patch,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

// Interfaz para el objeto User que viene en el Request (inyectado por JwtStrategy)
interface RequestWithUser {
  user: {
    userId: string;
    email: string;
    role: string;
    businessName: string;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req: RequestWithUser) {
    // LOG DE DEPURACIÓN: Ver qué llegó al controlador
    console.log('👤 Controller req.user:', req.user);

    if (!req.user || !req.user.userId) {
      throw new UnauthorizedException(
        'No se pudo identificar al usuario en el request',
      );
    }

    return this.usersService.findOne(req.user.userId);
  }

  @Patch('profile')
  updateProfile(@Request() req: RequestWithUser, @Body() body: any) {
    if (!req.user || !req.user.userId) {
      throw new UnauthorizedException(
        'No se pudo identificar al usuario en el request',
      );
    }
    return this.usersService.update(req.user.userId, body);
  }
}
