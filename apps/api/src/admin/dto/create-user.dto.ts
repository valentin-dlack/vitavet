import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { UserRole } from '../../auth/guards/roles.guard';

export class CreateUserDto {
  @ApiProperty({
    description: "Adresse email de l'utilisateur",
    example: 'john.doe@example.com',
    type: 'string',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "Prénom de l'utilisateur",
    example: 'John',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: "Nom de famille de l'utilisateur",
    example: 'Doe',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: "Mot de passe de l'utilisateur (minimum 8 caractères)",
    example: 'SecurePass123!',
    type: 'string',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiProperty({
    description: "Rôle de l'utilisateur dans le système",
    example: 'VET',
    enum: ['OWNER', 'VET', 'ASV', 'ADMIN_CLINIC', 'WEBMASTER'],
  })
  @IsEnum(['OWNER', 'VET', 'ASV', 'ADMIN_CLINIC', 'WEBMASTER'], {
    message: 'Role must be one of: OWNER, VET, ASV, ADMIN_CLINIC, WEBMASTER',
  })
  @IsNotEmpty()
  role: UserRole;

  @ApiProperty({
    description:
      'ID de la clinique (requis pour les rôles VET, ASV, ADMIN_CLINIC)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  clinicId?: string;
}
