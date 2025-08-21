import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export type GlobalRole = 'OWNER' | 'WEBMASTER';

@Entity('user_global_role')
export class UserGlobalRole {
  @PrimaryColumn('uuid')
  userId!: string;

  @PrimaryColumn('text')
  role!: GlobalRole;

  @ManyToOne(() => User, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
