import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class RejectAppointmentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, {
    message: 'Rejection reason must be at least 10 characters long',
  })
  @MaxLength(500, {
    message: 'Rejection reason must not exceed 500 characters',
  })
  rejectionReason!: string;
}
