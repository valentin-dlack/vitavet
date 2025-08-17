import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_service_slug', { unique: true })
  @Column({ type: 'text', unique: true })
  slug!: string; // e.g., 'urgence', 'imagerie', 'nac', 'chirurgie', 'consultation'

  @Column({ type: 'text' })
  label!: string; // e.g., 'Urgences', 'Imagerie'

  @Column({ type: 'text', nullable: true })
  description?: string | null;
}
