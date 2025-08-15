import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('reminder_rule')
export class ReminderRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  scope!: 'APPOINTMENT';

  @Column('int', { name: 'offset_days', default: -7 })
  offsetDays!: number;

  @Column('boolean', { name: 'channel_email', default: true })
  channelEmail!: boolean;

  @Column('boolean', { name: 'channel_push', default: false })
  channelPush!: boolean;

  @Column('boolean', { default: true })
  active!: boolean;
}
