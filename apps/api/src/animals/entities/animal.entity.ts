import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('animals')
export class Animal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  ownerId!: string;

  @Column('uuid')
  clinicId!: string;

  @Column({ type: 'text' })
  name!: string;

  @Column({ type: 'date', nullable: true })
  birthdate?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
