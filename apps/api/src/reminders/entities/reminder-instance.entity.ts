import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReminderRule } from './reminder-rule.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('reminder_instance')
export class ReminderInstance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'rule_id' })
  ruleId!: string;

  @ManyToOne(() => ReminderRule)
  @JoinColumn({ name: 'rule_id' })
  rule?: ReminderRule;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('uuid', { name: 'appointment_id', nullable: true })
  appointmentId?: string | null;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: Appointment;

  @Column('timestamptz', { name: 'send_at' })
  sendAt!: Date;

  @Column('text')
  status!: 'SCHEDULED' | 'SENT' | 'FAILED' | 'CANCELLED';

  @Column('jsonb', { default: {} })
  payload!: Record<string, unknown>;
}
