import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CompleteAppointmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  report?: string;
}
