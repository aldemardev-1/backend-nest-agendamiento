// backend/src/employees/dto/availability.dto.ts
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// Este DTO define la forma de UN SOLO día (ej. Lunes)
export class AvailabilitySlotDto {
  @IsInt()
  @Min(0) // Domingo
  @Max(6) // Sábado
  dayOfWeek: number;

  @IsBoolean()
  isAvailable: boolean;

  @IsOptional()
  @IsString()
  // Idealmente validaríamos formato "HH:mm" (ej. "09:00")
  // pero IsString() es suficiente por ahora.
  startTime: string | null;

  @IsOptional()
  @IsString()
  endTime: string | null;
}

// Este es el DTO principal que recibirá el Body
// Espera un objeto que contenga una propiedad "availability"
// que es un array de los slots de arriba.
export class UpdateAvailabilityDto {
  @ValidateNested({ each: true }) // Valida cada objeto en el array
  @Type(() => AvailabilitySlotDto)
  availability: AvailabilitySlotDto[];
}
