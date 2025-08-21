import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  reason: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
