import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { RemindersModule } from './reminders/reminders.module';
import { NotificationsModule } from './notifications/notifications.module';
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
import { AppointmentsModule } from './appointments/appointments.module';
import { AgendaModule } from './agenda/agenda.module';
import { User } from './users/entities/user.entity';
import { Clinic } from './clinics/entities/clinic.entity';
import { UserClinicRole } from './users/entities/user-clinic-role.entity';
import { UserGlobalRole } from './users/entities/user-global-role.entity';
import { Animal } from './animals/entities/animal.entity';
import { AppointmentType } from './appointments/entities/appointment-type.entity';
import { Appointment } from './appointments/entities/appointment.entity';
import { AgendaBlock } from './agenda/entities/agenda-block.entity';
import { ReminderRule } from './reminders/entities/reminder-rule.entity';
import { ReminderInstance } from './reminders/entities/reminder-instance.entity';
import { NotificationLog } from './notifications/entities/notification-log.entity';
import { TimeSlot } from './slots/entities/time-slot.entity';
import { AnimalsModule } from './animals/animals.module';
import { Service as ClinicService } from './clinics/entities/service.entity';
import { AdminModule } from './admin/admin.module';
import { DocumentsModule } from './documents/documents.module';
import { Document } from './documents/entities/document.entity';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SentryModule } from '@sentry/nestjs/setup';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { AccountDeletionRequest } from './auth/entities/account-deletion-request.entity';

@Module({
  imports: [
    SentryModule.forRoot(),
    ScheduleModule.forRoot(),
    RemindersModule,
    NotificationsModule,
    TypeOrmModule.forRoot({
      ...databaseConfig,
      entities: [
        User,
        Clinic,
        ClinicService,
        UserClinicRole,
        UserGlobalRole,
        Animal,
        AppointmentType,
        Appointment,
        AgendaBlock,
        ReminderRule,
        ReminderInstance,
        NotificationLog,
        TimeSlot,
        Document,
        AccountDeletionRequest,
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
    AppointmentsModule,
    AnimalsModule,
    AgendaModule,
    AdminModule,
    DocumentsModule,

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads/',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply throttling globally to cover all routes
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: SentryGlobalFilter },
  ],
})
export class AppModule {}
