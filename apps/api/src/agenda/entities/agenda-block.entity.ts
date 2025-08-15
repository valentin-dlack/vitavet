import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('agenda_block')
export class AgendaBlock {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  clinicId!: string;

  @Column('uuid')
  vetUserId!: string;

  @Column('timestamptz', { name: 'block_starts_at' })
  blockStartsAt!: Date;

  @Column('timestamptz', { name: 'block_ends_at' })
  blockEndsAt!: Date;

  @Column('text', { nullable: true })
  reason?: string | null;
}
