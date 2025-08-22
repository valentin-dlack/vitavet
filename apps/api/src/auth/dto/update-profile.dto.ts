import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({
    description: "Nouveau prénom de l'utilisateur (optionnel)",
    example: 'John',
    type: 'string',
    minLength: 2,
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName?: string;

  @ApiProperty({
    description: "Nouveau nom de famille de l'utilisateur (optionnel)",
    example: 'Doe',
    type: 'string',
    minLength: 2,
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName?: string;

  @ApiProperty({
    description: "Nouvelle adresse email de l'utilisateur (optionnel)",
    example: 'john.doe@example.com',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;
}
