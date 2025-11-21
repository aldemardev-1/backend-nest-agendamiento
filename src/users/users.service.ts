import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    // --- PROTECCIÓN DE SEGURIDAD ---
    // Si por alguna razón el ID llega undefined (token corrupto),
    // lanzamos error controlado en lugar de romper Prisma.
    console.log('id: ', id);
    if (!id) {
      throw new NotFoundException('Usuario no identificado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      // Seleccionamos solo lo necesario para el perfil
      select: {
        id: true,
        email: true,
        businessName: true,
        phone: true,
        address: true,
        city: true,
        role: true,
        plan: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async update(id: string, data: { businessName?: string; phone?: string; address?: string; city?: string }) {
    if (!id) throw new NotFoundException('Usuario no identificado');
    
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        businessName: true,
        phone: true,
        address: true,
        city: true,
      },
    });
  }
}