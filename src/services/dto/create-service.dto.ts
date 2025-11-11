// backend/src/services/dto/create-service.dto.ts
import { IsNotEmpty, IsString, IsNumber, IsInt, Min, IsPositive } from 'class-validator';
import { Type } from 'class-transformer'; // Para transformar los tipos

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt({ message: 'La duración debe ser un número entero' })
  @Min(5, { message: 'La duración debe ser de al menos 5 minutos' })
  @IsPositive()
  @Type(() => Number) // Transforma el string (si llega) a número
  duration: number;

  @IsNumber()
  @IsPositive({ message: 'El precio debe ser un número positivo' })
  @Type(() => Number) // Transforma el string (si llega) a número
  price: number;
}
