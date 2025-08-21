import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

enum ClinicRole {
  VET = 'VET',
  ASV = 'ASV',
  ADMIN_CLINIC = 'ADMIN_CLINIC',
}

export class AssignRoleDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(ClinicRole, {
    message: `Role must be one of the following values: ${Object.values(ClinicRole).join(', ')}`,
  })
  @IsNotEmpty()
  role: ClinicRole;
}
