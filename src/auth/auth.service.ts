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
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, businessName } = registerDto;
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
      const user = await this.prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          businessName,
        },
        select: { id: true, email: true, businessName: true, role: true },
      });

      // PASAMOS EL BUSINESS NAME AQUÍ
      return this.signToken(user.id, user.email, user.role, user.businessName);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('El correo electrónico ya está registrado');
      }
      throw new InternalServerErrorException();
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch)
      throw new UnauthorizedException('Credenciales inválidas');

    // PASAMOS EL BUSINESS NAME AQUÍ TAMBIÉN
    return this.signToken(user.id, user.email, user.role, user.businessName);
  }

  private signToken(
    userId: string,
    email: string,
    role: string,
    name: string, // <-- 1. Recibimos el nombre
  ): { message: string; accessToken: string } {
    const payload = {
      sub: userId,
      email: email,
      role: role,
      name: name, // <-- 2. Lo metemos al token
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Login exitoso',
      accessToken: accessToken,
    };
  }
}
