import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: "Mot de passe actuel de l'utilisateur",
    example: 'CurrentPass123!',
    type: 'string',
  })
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description:
      'Nouveau mot de passe (minimum 8 caractères, avec majuscule, minuscule, chiffre et caractère spécial)',
    example: 'NewSecurePass123!',
    type: 'string',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial',
  })
  newPassword: string;

  @ApiProperty({
    description:
      'Confirmation du nouveau mot de passe (doit être identique au nouveau mot de passe)',
    example: 'NewSecurePass123!',
    type: 'string',
  })
  @IsString()
  confirmPassword: string;
}
