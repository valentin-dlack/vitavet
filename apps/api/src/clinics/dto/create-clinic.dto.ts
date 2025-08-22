import { IsString, IsNotEmpty, IsPostalCode } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClinicDto {
  @ApiProperty({
    description: 'Nom de la clinique vétérinaire',
    example: 'Clinique Vétérinaire du Centre',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Ville de la clinique',
    example: 'Paris',
    type: 'string',
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Code postal de la clinique (format français)',
    example: '75001',
    type: 'string',
  })
  @IsPostalCode('FR')
  @IsNotEmpty()
  postcode: string;
}
