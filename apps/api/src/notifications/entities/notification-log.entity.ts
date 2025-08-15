import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notification_log')
export class NotificationLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'instance_id' })
  instanceId!: string;

  @Column('text')
  channel!: 'EMAIL' | 'PUSH';

  @Column('text', { name: 'delivery_status', nullable: true })
  deliveryStatus?: 'DELIVERED' | 'BOUNCED' | 'DROPPED' | null;

  @CreateDateColumn({ name: 'sent_at' })
  sentAt!: Date;

  @Column('timestamptz', { name: 'opened_at', nullable: true })
  openedAt?: Date | null;
}


