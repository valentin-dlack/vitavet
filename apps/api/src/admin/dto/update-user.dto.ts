import { IsEmail, IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';
import type { UserRole } from '../../auth/guards/roles.guard';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(['OWNER', 'VET', 'ASV', 'ADMIN_CLINIC', 'WEBMASTER'], {
    message: 'Role must be one of: OWNER, VET, ASV, ADMIN_CLINIC, WEBMASTER',
  })
  @IsOptional()
  role?: UserRole;

  @IsUUID()
  @IsOptional()
  clinicId?: string;
}
