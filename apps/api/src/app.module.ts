import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { databaseConfig } from './config/database.config';
import { ClinicsModule } from './clinics/clinics.module';
import { SlotsModule } from './slots/slots.module';
import { User } from './users/entities/user.entity';
import { Clinic } from './clinics/entities/clinic.entity';
import { UserClinicRole } from './users/entities/user-clinic-role.entity';
import { Animal } from './animals/entities/animal.entity';
import { AppointmentType } from './appointments/entities/appointment-type.entity';
import { Appointment } from './appointments/entities/appointment.entity';
import { AgendaBlock } from './agenda/entities/agenda-block.entity';
import { ReminderRule } from './reminders/entities/reminder-rule.entity';
import { ReminderInstance } from './reminders/entities/reminder-instance.entity';
import { NotificationLog } from './notifications/entities/notification-log.entity';
import { TimeSlot } from './slots/entities/time-slot.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...databaseConfig,
      entities: [
        User,
        Clinic,
        UserClinicRole,
        Animal,
        AppointmentType,
        Appointment,
        AgendaBlock,
        ReminderRule,
        ReminderInstance,
        NotificationLog,
        TimeSlot,
      ],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    HealthModule,
    AuthModule,
    UsersModule,
    ClinicsModule,
    SlotsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
