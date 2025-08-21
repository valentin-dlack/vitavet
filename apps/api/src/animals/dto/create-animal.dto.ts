import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsUUID,
} from 'class-validator';

export class CreateAnimalDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'UNKNOWN'])
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN';

  @IsOptional()
  @IsBoolean()
  isSterilized?: boolean;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  chipId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  heightCm?: number;

  @IsOptional()
  @IsBoolean()
  isNac?: boolean;

  @IsUUID()
  clinicId!: string;
}
