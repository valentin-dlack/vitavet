import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { ReminderRule } from '../src/reminders/entities/reminder-rule.entity';
import { Appointment } from '../src/appointments/entities/appointment.entity';
import { AppointmentType } from '../src/appointments/entities/appointment-type.entity';
import { Animal } from '../src/animals/entities/animal.entity';
import { User } from '../src/users/entities/user.entity';
import { Clinic } from '../src/clinics/entities/clinic.entity';
import { UserClinicRole } from '../src/users/entities/user-clinic-role.entity';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';
import { NotificationService } from '../src/notifications/notification.service';

describe('Reminders (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(NotificationService)
      .useValue({
        sendReminderEmail: jest.fn().mockResolvedValue(true),
        logNotification: jest.fn().mockResolvedValue(undefined),
        getNotificationStats: jest.fn().mockResolvedValue({}),
        getNotificationLogs: jest.fn().mockResolvedValue([]),
        testEmailConnection: jest.fn().mockResolvedValue(false),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
    dataSource = moduleFixture.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('plans and processes reminders for an appointment', async () => {
    const userRepo = dataSource.getRepository(User);
    const clinicRepo = dataSource.getRepository(Clinic);
    const ucrRepo = dataSource.getRepository(UserClinicRole);
    const animalRepo = dataSource.getRepository(Animal);
    const aptTypeRepo = dataSource.getRepository(AppointmentType);
    const aptRepo = dataSource.getRepository(Appointment);
    const ruleRepo = dataSource.getRepository(ReminderRule);

    const owner = await userRepo.save({
      firstName: 'R',
      lastName: 'Owner',
      email: `r.owner.${Date.now()}@e2e.test`,
      password: 'x',
    });
    const clinic = await clinicRepo.save({
      name: 'Rem Clinic',
      city: 'RC',
      postcode: '00000',
    });
    await ucrRepo.save({
      userId: owner.id,
      clinicId: clinic.id,
      role: 'OWNER',
    });

    const animal = await animalRepo.save({
      name: 'Rex',
      species: 'Chien',
      breed: 'Labrador',
      owner,
      clinic,
    });
    const aptType = await aptTypeRepo.save({
      label: 'Test Consultation',
      durationMin: 30,
    });

    const future = new Date();
    future.setDate(future.getDate() + 1);
    const apt = await aptRepo.save({
      clinicId: clinic.id,
      animalId: animal.id,
      vetUserId: owner.id,
      typeId: aptType.id,
      status: 'CONFIRMED',
      startsAt: future,
      endsAt: new Date(future.getTime() + 30 * 60000),
      createdByUserId: owner.id,
    });
    await ruleRepo.save({
      scope: 'APPOINTMENT',
      offsetDays: -1,
      channelEmail: true,
      channelPush: false,
      active: true,
    });

    // plan
    const res1 = await request(app.getHttpServer())
      .post(`/api/reminders/plan/appointment/${apt.id}`)
      .expect(201);
    expect(res1.body).toEqual({ planned: true });

    // run-due (should process instances with send_at in the past)
    const res2 = await request(app.getHttpServer())
      .post('/api/reminders/run-due')
      .expect(201);
    expect(res2.body.processed).toBeGreaterThanOrEqual(1); // At least 1 processed
  }, 10000);
});
