import { IsString, IsNotEmpty, IsIn } from 'class-validator';

// Define el plan que el usuario quiere comprar
export class CreatePaymentLinkDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['PROFESIONAL', 'EMPRESA'])
  plan: 'PROFESIONAL' | 'EMPRESA';
}
