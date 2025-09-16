import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAnimalDto {
  @ApiPropertyOptional({ description: "Nom de l'animal", example: 'Rex' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Date de naissance (YYYY-MM-DD)',
    example: '2020-05-15',
  })
  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @ApiPropertyOptional({ description: "Espèce de l'animal", example: 'Chien' })
  @IsOptional()
  @IsString()
  species?: string;

  @ApiPropertyOptional({ description: "Race de l'animal", example: 'Labrador' })
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiPropertyOptional({
    description: 'Sexe',
    enum: ['MALE', 'FEMALE', 'UNKNOWN'],
  })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'UNKNOWN'])
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN';

  @ApiPropertyOptional({ description: 'Stérilisé', example: true })
  @IsOptional()
  @IsBoolean()
  isSterilized?: boolean;

  @ApiPropertyOptional({ description: 'Couleur', example: 'Noir' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    description: 'Numéro de puce',
    example: '250269000123456',
  })
  @IsOptional()
  @IsString()
  chipId?: string;

  @ApiPropertyOptional({
    description: 'Poids (kg)',
    example: 25.5,
    minimum: 0,
    maximum: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  weightKg?: number;

  @ApiPropertyOptional({
    description: 'Taille (cm)',
    example: 55,
    minimum: 0,
    maximum: 300,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  heightCm?: number;

  @ApiPropertyOptional({ description: 'NAC', example: false })
  @IsOptional()
  @IsBoolean()
  isNac?: boolean;
}
