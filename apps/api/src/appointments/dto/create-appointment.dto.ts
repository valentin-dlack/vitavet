import { IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({
    description: 'ID de la clinique vétérinaire',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @IsUUID()
  clinicId: string;

  @ApiProperty({
    description: "ID de l'animal",
    example: '456e7890-e89b-12d3-a456-426614174001',
    type: 'string',
  })
  @IsUUID()
  animalId: string;

  @ApiProperty({
    description: 'ID du vétérinaire',
    example: '789e0123-e89b-12d3-a456-426614174002',
    type: 'string',
  })
  @IsUUID()
  vetUserId: string;

  @ApiProperty({
    description: 'Date et heure de début du rendez-vous (format ISO 8601)',
    example: '2024-01-15T10:00:00Z',
    type: 'string',
  })
  @IsDateString()
  startsAt: string;

  @ApiProperty({
    description: 'ID du type de rendez-vous (optionnel)',
    example: '012e3456-e89b-12d3-a456-426614174003',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  typeId?: string;
}
