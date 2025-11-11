import { IsOptional, IsInt, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer'; // ¡Necesario para transformar strings de query!

export class AdminQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number) // Transforma el string '1' (de la URL) a number 1
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string; // Para buscar por nombre de negocio o email
}
