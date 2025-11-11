import { IsDateString, IsNotEmpty, IsString, IsUUID } from 'class-validator';
// Quitamos IsUUID y lo reemplazamos por IsString

/**
 * Define y valida los query params que esperamos
 * para el endpoint público de disponibilidad.
 */
export class AvailabilityQueryDto {
  @IsDateString()
  @IsNotEmpty()
  date: string; // Recibido como un ISO string (ej: "2025-11-20")

  // --- ¡CORRECCIÓN! ---
  // Cambiamos @IsUUID() por @IsString() porque Prisma usa CUIDs
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  // --- ¡CORRECCIÓN! ---
  @IsString()
  @IsNotEmpty()
  serviceId: string;
}
