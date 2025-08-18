import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';

enum UserRole {
  OWNER = 'OWNER',
  VET = 'VET',
  ASV = 'ASV',
  ADMIN_CLINIC = 'ADMIN_CLINIC',
  WEBMASTER = 'WEBMASTER',
}

export class AssignRoleDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(UserRole, {
    message: `Role must be one of the following values: ${Object.values(UserRole).join(', ')}`,
  })
  @IsNotEmpty()
  role: UserRole;
}
