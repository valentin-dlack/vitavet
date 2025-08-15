import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('user_clinic_role')
export class UserClinicRole {
  @PrimaryColumn('uuid')
  userId!: string;

  @PrimaryColumn('uuid')
  clinicId!: string;

  @PrimaryColumn('text')
  role!: 'OWNER' | 'VET' | 'ASV' | 'ADMIN_CLINIC';
}


