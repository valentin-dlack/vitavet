import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Raison de la suppression du compte (minimum 10 caractères)',
    example:
      'Je ne souhaite plus utiliser ce service et je veux supprimer mes données personnelles.',
    type: 'string',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  reason: string;

  @ApiProperty({
    description: 'Mot de passe actuel pour confirmer la suppression',
    example: 'CurrentPass123!',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
