import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { AvailableSlot } from 'src/slots/slots.service';

describe('SlotsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/slots (GET) - should return available slots', () => {
    return request(app.getHttpServer())
      .get('/api/slots')
      .query({
        clinicId: '550e8400-e29b-41d4-a716-446655440000',
        date: '2024-01-15',
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
        expect(firstSlot.durationMinutes).toBe(30);
      });
  });

  it('/api/slots (GET) - should filter by vet when vetUserId provided', () => {
    return request(app.getHttpServer())
      .get('/api/slots')
      .query({
        clinicId: '550e8400-e29b-41d4-a716-446655440000',
        date: '2024-01-15',
        vetUserId: '550e8400-e29b-41d4-a716-446655440001',
      })
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        (res.body as AvailableSlot[]).forEach((slot) => {
          expect(slot.vetUserId).toBe('550e8400-e29b-41d4-a716-446655440001');
        });
      });
  });

  it('/api/slots/seed (POST) - should seed demo slots', () => {
    return request(app.getHttpServer())
      .post('/api/slots/seed')
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty(
          'message',
          'Demo slots seeded successfully',
        );
      });
  });
});
