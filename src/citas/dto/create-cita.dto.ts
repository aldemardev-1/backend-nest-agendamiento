import { IsString, IsNotEmpty, IsISO8601, IsOptional } from 'class-validator';

export class CreateCitaDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsString()
  @IsNotEmpty()
  clienteId: string; // El ID de un cliente ya existente

  @IsISO8601() // Asegura que sea una fecha/hora válida en formato ISO
  @IsNotEmpty()
  startTime: string; // Ej: "2025-10-31T14:30:00.000Z"

  @IsString()
  @IsOptional()
  notes?: string;
}
