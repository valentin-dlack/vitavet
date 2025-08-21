import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Clinic } from '../../clinics/entities/clinic.entity';
import type { UserRole } from 'src/auth/guards/roles.guard';

@Entity('user_clinic_role')
export class UserClinicRole {
  @PrimaryColumn('uuid')
  userId!: string;

  @PrimaryColumn('uuid')
  clinicId!: string;

  @PrimaryColumn('text')
  role!: UserRole;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => Clinic, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinicId' })
  clinic?: Clinic;
}
