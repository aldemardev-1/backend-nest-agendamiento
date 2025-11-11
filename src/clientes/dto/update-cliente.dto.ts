import { PartialType } from '@nestjs/mapped-types';
import { CreateClienteDto } from './create-cliente.dto';
// UpdateClienteDto hereda todas las validaciones de CreateClienteDto,
// pero las marca todas como opcionales.
// Esto es perfecto para las operaciones PATCH.
export class UpdateClienteDto extends PartialType(CreateClienteDto) {}
