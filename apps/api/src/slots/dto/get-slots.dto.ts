import { IsOptional, IsDateString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetSlotsDto {
  @IsUUID()
  clinicId: string;

  @IsDateString()
  @Transform(({ value }: { value: string }) => {
    // Ensure date is in YYYY-MM-DD format
    const date = new Date(value);
    return date.toISOString().split('T')[0];
  })
  date: string;

  @IsOptional()
  @IsUUID()
  vetUserId?: string;
}
