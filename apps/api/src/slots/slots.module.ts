import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlotsService } from './slots.service';
import { SlotsController } from './slots.controller';
import { TimeSlot } from './entities/time-slot.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { UserClinicRole } from '../users/entities/user-clinic-role.entity';
import { Clinic } from '../clinics/entities/clinic.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TimeSlot, Appointment, UserClinicRole, Clinic]),
  ],
  providers: [SlotsService],
  controllers: [SlotsController],
  exports: [SlotsService],
})
export class SlotsModule {}
