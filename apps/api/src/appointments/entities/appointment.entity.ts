import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Clinic } from '../../clinics/entities/clinic.entity';
import { Animal } from '../../animals/entities/animal.entity';
import { User } from '../../users/entities/user.entity';
import { AppointmentType } from './appointment-type.entity';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'CANCELLED';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  clinicId!: string;

  @ManyToOne(() => Clinic, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinicId' })
  clinic?: Clinic;

  @Column('uuid')
  animalId!: string;

  @ManyToOne(() => Animal, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'animalId' })
  animal?: Animal;

  @Column('uuid')
  vetUserId!: string;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vetUserId' })
  vet?: User;

  @Column('uuid', { nullable: true })
  typeId?: string | null;

  @ManyToOne(() => AppointmentType, { eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'typeId' })
  type?: AppointmentType | null;

  @Column('text')
  status!: AppointmentStatus;

  @Index('idx_appointment_starts_at')
  @Column('timestamptz')
  startsAt!: Date;

  @Column('timestamptz')
  endsAt!: Date;

  @Column('uuid', { name: 'created_by_user_id' })
  createdByUserId!: string;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser?: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
