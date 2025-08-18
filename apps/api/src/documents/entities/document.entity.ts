import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { User } from '../../users/entities/user.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  appointmentId!: string;

  @ManyToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment?: Appointment;

  @Column('uuid')
  uploadedByUserId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedByUserId' })
  uploadedByUser?: User;

  @Column()
  filename!: string; // Original filename

  @Column()
  storagePath!: string; // Path on the disk/storage

  @Column()
  mimetype!: string;

  @Column('bigint')
  sizeBytes!: number;

  @Column({ nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
