import { IsString, IsNotEmpty, IsPostalCode } from 'class-validator';

export class CreateClinicDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsPostalCode('FR')
  @IsNotEmpty()
  postcode: string;
}
