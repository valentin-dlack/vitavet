import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

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

  @Column('uuid')
  animalId!: string;

  @Column('uuid')
  vetUserId!: string;

  @Column('uuid', { nullable: true })
  typeId?: string | null;

  @Column('text')
  status!: AppointmentStatus;

  @Index('idx_appointment_starts_at')
  @Column('timestamptz')
  startsAt!: Date;

  @Column('timestamptz')
  endsAt!: Date;

  @Column('uuid', { name: 'created_by_user_id' })
  createdByUserId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
