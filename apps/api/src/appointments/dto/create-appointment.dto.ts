import { IsUUID, IsDateString, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @IsUUID()
  clinicId: string;

  @IsUUID()
  animalId: string;

  @IsUUID()
  vetUserId: string;

  @IsDateString()
  startsAt: string;

  @IsOptional()
  @IsUUID()
  typeId?: string;
}
