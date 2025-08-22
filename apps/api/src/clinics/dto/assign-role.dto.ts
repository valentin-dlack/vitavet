import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum ClinicRole {
  VET = 'VET',
  ASV = 'ASV',
  ADMIN_CLINIC = 'ADMIN_CLINIC',
}

export class AssignRoleDto {
  @ApiProperty({
    description: "ID de l'utilisateur à qui assigner le rôle",
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: 'string',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Rôle à assigner dans la clinique',
    example: 'VET',
    enum: ['VET', 'ASV', 'ADMIN_CLINIC'],
  })
  @IsEnum(ClinicRole, {
    message: `Role must be one of the following values: ${Object.values(ClinicRole).join(', ')}`,
  })
  @IsNotEmpty()
  role: ClinicRole;
}
