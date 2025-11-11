import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth') // Ruta base: /auth
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register') // Ruta completa: POST /auth/register
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // --- ¡NUEVO ENDPOINT DE LOGIN! ---
  @Post('login') // Ruta completa: POST /auth/login
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt')) // <-- 1. ¡Aquí está el Guardia!
  getProfile() {
    // Si llegas aquí, el token es válido.
    // NestJS habrá ejecutado JwtStrategy y tendrá el 'user'
    // (Aunque aquí no lo estamos usando todavía)
    return { message: 'Este es un perfil protegido' };
  }
}
