import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Clinic } from '../../clinics/entities/clinic.entity';

@Entity('animals')
export class Animal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  ownerId!: string;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner?: User;

  @Column('uuid')
  clinicId!: string;

  @ManyToOne(() => Clinic, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clinicId' })
  clinic?: Clinic;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'date', nullable: true })
  birthdate?: string | null;

  @Column({ type: 'text', nullable: true })
  species?: string | null; // e.g., dog, cat, rabbit

  @Column({ type: 'text', nullable: true })
  breed?: string | null;

  @Column({ type: 'text', nullable: true })
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN' | null;

  @Column({ type: 'boolean', nullable: true })
  isSterilized?: boolean | null;

  @Column({ type: 'text', nullable: true })
  color?: string | null;

  @Column({ type: 'text', nullable: true })
  chipId?: string | null;

  @Column({ type: 'float', nullable: true })
  weightKg?: number | null;

  @Column({ type: 'int', nullable: true })
  heightCm?: number | null;

  @Column({ type: 'boolean', nullable: true })
  isNac?: boolean | null; // Nouveaux Animaux de Compagnie

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
