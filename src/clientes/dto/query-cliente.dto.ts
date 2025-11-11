import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryClienteDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number) // Transforma el string '1' a número 1
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number) // Transforma el string '10' a número 10
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string = '';
}
