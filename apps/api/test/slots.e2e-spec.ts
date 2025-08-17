import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AvailableSlot, SlotsService } from '../src/slots/slots.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Clinic } from '../src/clinics/entities/clinic.entity';
import { User } from '../src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { UserClinicRole } from '../src/users/entities/user-clinic-role.entity';

describe('SlotsController (e2e)', () => {
  let app: INestApplication;
  let clinicRepo: Repository<Clinic>;
  let userRepo: Repository<User>;
  let ucrRepo: Repository<UserClinicRole>;
  let slotsService: SlotsService;
  let testClinic: Clinic;
  let testVet: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    clinicRepo = moduleFixture.get(getRepositoryToken(Clinic));
    userRepo = moduleFixture.get(getRepositoryToken(User));
    ucrRepo = moduleFixture.get(getRepositoryToken(UserClinicRole));
    slotsService = moduleFixture.get(SlotsService);

    // Create test data
    testClinic = await clinicRepo.save({
      name: 'E2E Test Clinic',
      city: 'Testville',
      postcode: '12345',
    });

    testVet = await userRepo.save({
      firstName: 'E2E',
      lastName: 'Vet',
      email: 'e2e.vet@test.com',
      password: 'password',
    });

    await ucrRepo.save({
      userId: testVet.id,
      clinicId: testClinic.id,
      role: 'VET',
    });

    // Seed slots for the test data
    await slotsService.seedDemoSlots(testClinic.id, testVet.id);
  });

  afterAll(async () => {
    // Clean up test data
    await ucrRepo.delete({ clinicId: testClinic.id });
    await clinicRepo.delete(testClinic.id);
    await userRepo.delete(testVet.id);
    await app.close();
  });

  it('/api/slots (GET) - should return available slots', () => {
    return request(app.getHttpServer())
      .get('/api/slots')
      .query({
        clinicId: testClinic.id,
        date: new Date().toISOString().split('T')[0], // Use today's date
      })
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);

        const firstSlot = res.body[0];
        expect(firstSlot).toHaveProperty('id');
        expect(firstSlot).toHaveProperty('startsAt');
        expect(firstSlot).toHaveProperty('endsAt');
        expect(firstSlot).toHaveProperty('durationMinutes');
      });
  });

  it('/api/slots (GET) - should filter by vet when vetUserId provided', () => {
    return request(app.getHttpServer())
      .get('/api/slots')
      .query({
        clinicId: testClinic.id,
        date: new Date().toISOString().split('T')[0],
        vetUserId: testVet.id,
      })
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        (res.body as AvailableSlot[]).forEach((slot) => {
          expect(slot.vetUserId).toBe(testVet.id);
        });
      });
  });

  // This test is now redundant as we seed slots in beforeAll
  it('/api/slots/seed (POST) - should be disabled or protected in E2E', () => {
    return request(app.getHttpServer())
      .post('/api/slots/seed')
      .expect(404); // or 403 if protected
  });
});
