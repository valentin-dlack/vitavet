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
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnimalDto {
  @ApiProperty({
    description: "Nom de l'animal",
    example: 'Rex',
    type: 'string',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: "Date de naissance de l'animal (format: YYYY-MM-DD)",
    example: '2020-05-15',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @ApiProperty({
    description: "Espèce de l'animal",
    example: 'Chien',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  species?: string;

  @ApiProperty({
    description: "Race de l'animal",
    example: 'Golden Retriever',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiProperty({
    description: "Sexe de l'animal",
    example: 'MALE',
    enum: ['MALE', 'FEMALE', 'UNKNOWN'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'UNKNOWN'])
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN';

  @ApiProperty({
    description: "L'animal est-il stérilisé ?",
    example: true,
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isSterilized?: boolean;

  @ApiProperty({
    description: "Couleur de l'animal",
    example: 'Blond',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({
    description: 'Numéro de puce électronique',
    example: '250269000123456',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString()
  chipId?: string;

  @ApiProperty({
    description: "Poids de l'animal en kilogrammes",
    example: 25.5,
    type: 'number',
    minimum: 0,
    maximum: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  weightKg?: number;

  @ApiProperty({
    description: "Taille de l'animal en centimètres",
    example: 55,
    type: 'number',
    minimum: 0,
    maximum: 300,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  heightCm?: number;

  @ApiProperty({
    description: "L'animal est-il un NAC (Nouveaux Animaux de Compagnie) ?",
    example: false,
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isNac?: boolean;

  @ApiProperty({
    description: 'ID de la clinique vétérinaire',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @IsUUID()
  clinicId!: string;
}
