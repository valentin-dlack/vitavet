import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { RemindersProcessor } from './reminders.processor';
import { ReminderRule } from './entities/reminder-rule.entity';
import { ReminderInstance } from './entities/reminder-instance.entity';
import { NotificationLog } from '../notifications/entities/notification-log.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReminderRule,
      ReminderInstance,
      NotificationLog,
      Appointment,
    ]),
    NotificationsModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService, RemindersProcessor],
  exports: [RemindersService],
})
export class RemindersModule {}
