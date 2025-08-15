import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UserClinicRole } from './entities/user-clinic-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserClinicRole])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
