import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: "Adresse email de l'utilisateur",
    example: 'john.doe@example.com',
    type: 'string',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    description: "Mot de passe de l'utilisateur",
    example: 'SecurePass123!',
    type: 'string',
    minLength: 1,
  })
  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password: string;
}
