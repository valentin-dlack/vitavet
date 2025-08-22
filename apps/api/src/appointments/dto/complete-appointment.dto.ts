import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteAppointmentDto {
  @ApiProperty({
    description: 'Notes de consultation (optionnel)',
    example: 'Animal en bonne santé générale. Vaccination à jour.',
    type: 'string',
    maxLength: 5000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @ApiProperty({
    description: 'Rapport de consultation détaillé (optionnel)',
    example:
      "Examen clinique complet effectué. Température normale (38.5°C), fréquence cardiaque régulière (80 bpm). Aucune anomalie détectée. Recommandations : continuer l'alimentation actuelle et surveiller le comportement.",
    type: 'string',
    maxLength: 5000,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  report?: string;
}
