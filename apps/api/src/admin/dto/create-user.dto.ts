import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import type { UserRole } from '../../auth/guards/roles.guard';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsEnum(['OWNER', 'VET', 'ASV', 'ADMIN_CLINIC', 'WEBMASTER'], {
    message: 'Role must be one of: OWNER, VET, ASV, ADMIN_CLINIC, WEBMASTER',
  })
  @IsNotEmpty()
  role: UserRole;

  @IsUUID()
  @IsOptional()
  clinicId?: string;
}
