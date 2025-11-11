import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, IsISO8601, IsString } from 'class-validator';

export class QueryCitaDto {
  // --- Paginación ---
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @IsOptional()
  @IsISO8601()
  endDate?: string;
  @IsOptional()
  @IsString()
  employeeId?: string;
}
