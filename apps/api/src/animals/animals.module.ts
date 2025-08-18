import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnimalsService } from './animals.service';
import { AnimalsController } from './animals.controller';
import { Animal } from './entities/animal.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { UserClinicRole } from '../users/entities/user-clinic-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Animal, Appointment, UserClinicRole])],
  providers: [AnimalsService],
  controllers: [AnimalsController],
  exports: [AnimalsService],
})
export class AnimalsModule {}
