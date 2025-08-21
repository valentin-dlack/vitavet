import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum DeletionRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

@Entity('account_deletion_requests')
export class AccountDeletionRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column('text')
  reason!: string;

  @Column('text', { name: 'status', default: DeletionRequestStatus.PENDING })
  status!: DeletionRequestStatus;

  @Column('text', { nullable: true })
  adminNotes?: string;

  @Column('uuid', { name: 'processed_by', nullable: true })
  processedBy?: string;

  @Column('timestamptz', { name: 'processed_at', nullable: true })
  processedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column('timestamptz', { name: 'scheduled_deletion_at', nullable: true })
  scheduledDeletionAt?: Date;
}
