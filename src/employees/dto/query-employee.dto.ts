// backend/src/employees/dto/query-employee.dto.ts
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryEmployeeDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number) // Transforma el query param (string) a número
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100) // Límite de 100 por página
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;
}
