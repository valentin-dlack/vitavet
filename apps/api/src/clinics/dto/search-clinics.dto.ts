import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SearchClinicsDto {
  @IsOptional()
  @IsString()
  @MaxLength(12)
  @Matches(/^[0-9A-Za-z\-\s]+$/)
  postcode?: string;
}


