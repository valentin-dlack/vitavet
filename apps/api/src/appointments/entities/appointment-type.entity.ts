import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('appointment_type')
export class AppointmentType {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  label!: string;

  @Column('int', { default: 30, name: 'duration_min' })
  durationMin!: number;
}


