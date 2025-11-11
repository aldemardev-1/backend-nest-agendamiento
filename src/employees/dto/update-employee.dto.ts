// backend/src/employees/dto/update-employee.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeDto } from './create-employee.dto';

// PartialType hace que todos los campos de CreateEmployeeDto sean opcionales
export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
