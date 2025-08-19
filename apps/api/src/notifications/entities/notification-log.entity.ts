import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('notification_log')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text', { name: 'notification_type' })
  notificationType!: string; // 'email', 'push', etc.

  @Column('text')
  recipient!: string; // email address or user ID

  @Column('text')
  status!: 'sent' | 'failed' | 'pending';

  @Column('text', { nullable: true })
  error?: string;

  @Column('text', { name: 'reminder_type', nullable: true })
  reminderType?: string; // 'appointment_24h', 'appointment_1h', etc.

  @Column('text', { name: 'message_id', nullable: true })
  messageId?: string; // SMTP message ID

  @CreateDateColumn({ name: 'sent_at' })
  sentAt!: Date;

  // Legacy fields for backward compatibility
  @Column('uuid', { name: 'instance_id', nullable: true })
  instanceId?: string;

  @Column('text', { nullable: true })
  channel?: 'EMAIL' | 'PUSH';

  @Column('text', { name: 'delivery_status', nullable: true })
  deliveryStatus?: 'DELIVERED' | 'BOUNCED' | 'DROPPED' | null;

  @Column('timestamptz', { name: 'opened_at', nullable: true })
  openedAt?: Date | null;
}
