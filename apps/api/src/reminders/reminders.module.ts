import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReminderRule } from './entities/reminder-rule.entity';
import { ReminderInstance } from './entities/reminder-instance.entity';
import { NotificationLog } from '../notifications/entities/notification-log.entity';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { RemindersProcessor } from './reminders.processor';
import { Appointment } from '../appointments/entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReminderRule,
      ReminderInstance,
      NotificationLog,
      Appointment,
    ]),
  ],
  providers: [RemindersService, RemindersProcessor],
  controllers: [RemindersController],
  exports: [RemindersService],
})
export class RemindersModule {}
