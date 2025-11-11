// backend/src/services/dto/update-service.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceDto } from './create-service.dto';

// PartialType toma todas las reglas de CreateServiceDto
// y las hace opcionales.
export class UpdateServiceDto extends PartialType(CreateServiceDto) {}