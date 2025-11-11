import { IsString, IsInt, IsOptional, IsIn } from 'class-validator';

export class UpdatePlanDto {
  @IsString()
  @IsIn(['GRATIS', 'PROFESIONAL', 'EMPRESA'])
  plan: string;

  @IsInt()
  @IsOptional() // Hacemos estos opcionales, el servicio pondrá los defaults
  maxEmployees?: number;

  @IsInt()
  @IsOptional()
  maxServices?: number;
}
