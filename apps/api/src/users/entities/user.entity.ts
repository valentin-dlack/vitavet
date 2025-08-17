import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { Animal } from '../../animals/entities/animal.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_user_email', { unique: true })
  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @OneToMany(() => Appointment, (apt) => apt.vet)
  vetAppointments?: Appointment[];

  @OneToMany(() => Appointment, (apt) => apt.createdByUser)
  createdAppointments?: Appointment[];

  @OneToMany(() => Animal, (a) => a.owner)
  animals?: Animal[];
}
