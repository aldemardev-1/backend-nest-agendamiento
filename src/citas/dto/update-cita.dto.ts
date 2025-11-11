import { PartialType } from '@nestjs/mapped-types';
import { CreateCitaDto } from './create-cita.dto';

// Al igual que con Clientes, el DTO de actualización
// hereda de CreateCitaDto pero hace todos los campos opcionales.
export class UpdateCitaDto extends PartialType(CreateCitaDto) {}
