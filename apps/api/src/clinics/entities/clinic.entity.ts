import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Animal } from '../../animals/entities/animal.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { ManyToMany, JoinTable } from 'typeorm';
import { Service } from './service.entity';

@Entity('clinics')
export class Clinic {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text' })
  name!: string;

  @Index('idx_clinic_postcode')
  @Column({ type: 'varchar', length: 12 })
  postcode!: string;

  @Column({ type: 'text' })
  city!: string;

  @Column({ type: 'text', nullable: true })
  addressLine1?: string | null;

  @Column({ type: 'text', nullable: true })
  addressLine2?: string | null;

  @Column({ type: 'text', nullable: true })
  country?: string | null;

  @Column({ type: 'text', nullable: true })
  phone?: string | null;

  @Column({ type: 'text', nullable: true })
  email?: string | null;

  @Column({ type: 'text', nullable: true })
  website?: string | null;

  @Column({ type: 'float', nullable: true })
  latitude?: number | null;

  @Column({ type: 'float', nullable: true })
  longitude?: number | null;

  @Column({ type: 'jsonb', nullable: true })
  openingHours?: Record<string, any> | null;

  @ManyToMany(() => Service, { eager: false })
  @JoinTable({
    name: 'clinic_services',
    joinColumn: { name: 'clinic_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'service_id', referencedColumnName: 'id' },
  })
  services?: Service[];

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => Animal, (a) => a.clinic)
  animals?: Animal[];

  @OneToMany(() => Appointment, (apt) => apt.clinic)
  appointments?: Appointment[];
}
