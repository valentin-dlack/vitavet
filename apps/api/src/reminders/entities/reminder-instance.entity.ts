import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('reminder_instance')
export class ReminderInstance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'rule_id' })
  ruleId!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('uuid', { name: 'appointment_id', nullable: true })
  appointmentId?: string | null;

  @Column('timestamptz', { name: 'send_at' })
  sendAt!: Date;

  @Column('text')
  status!: 'SCHEDULED' | 'SENT' | 'FAILED' | 'CANCELLED';

  @Column('jsonb', { default: {} })
  payload!: Record<string, unknown>;
}
