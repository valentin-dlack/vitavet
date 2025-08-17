import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentType } from './entities/appointment-type.entity';
import { User } from '../users/entities/user.entity';
import { Animal } from '../animals/entities/animal.entity';
import { TimeSlot } from '../slots/entities/time-slot.entity';
import { UserClinicRole } from '../users/entities/user-clinic-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AppointmentType,
      User,
      Animal,
      TimeSlot,
      UserClinicRole,
    ]),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
