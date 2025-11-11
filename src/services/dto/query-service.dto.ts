// backend/src/services/dto/query-service.dto.ts
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryServiceDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number) // Transforma el query param (string) a número
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100) // No permitir que pidan más de 100
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
