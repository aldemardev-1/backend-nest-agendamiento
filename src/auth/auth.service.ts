import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  // Inyectamos el servicio de Prisma
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, businessName } = registerDto;

    // 1. Hashear la contraseña
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      // 2. Crear el usuario en la base de datos
      const user = await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          businessName,
          // 'role' y 'plan' se asignan por defecto (según tu schema.prisma)
        },
        // 3. Seleccionar qué datos devolver
        select: {
          id: true,
          email: true,
          businessName: true,
          createdAt: true,
          role: true, // <-- MODIFICADO: Pedimos el 'role'
        },
      });

      // 4. <-- MODIFICADO: Ahora devolvemos un token al registrar
      return this.signToken(user.id, user.email, user.role);
    } catch (error) {
      // 5. Manejar errores (ej. email duplicado)
      if (error.code === 'P2002') {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      throw new InternalServerErrorException();
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Encontrar al usuario por email (y traer su 'role')
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      // (findUnique en el modelo trae todos los campos, 'role' ya viene)
    });

    // 2. Si no existe, lanzar error
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Comparar la contraseña
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    // 4. Si no coinciden, lanzar error
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 5. <-- MODIFICADO: Llamar a la función signToken
    return this.signToken(user.id, user.email, user.role);
  }

  // --- ¡NUEVA FUNCIÓN REFACTORIZADA! ---
  /**
   * Genera y firma un token JWT (basado en tu código)
   */
  private signToken(
    userId: string,
    email: string,
    role: string, // <-- 1. ACEPTA EL ROL
  ): { message: string; accessToken: string } {
    // 2. ¡LA CORRECCIÓN CLAVE! Añadir el 'role' al payload
    const payload = {
      sub: userId,
      email: email,
      role: role, // <-- ¡AÑADIDO!
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Login exitoso',
      accessToken: accessToken,
    };
  }
}
