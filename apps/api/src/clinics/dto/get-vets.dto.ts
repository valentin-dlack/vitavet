import { IsUUID } from 'class-validator';

export class GetVetsDto {
  @IsUUID()
  clinicId: string;
}
