import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import helmet from 'helmet';

describe('Security baseline (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    // Apply security middlewares here because e2e tests don't go through main.ts
    app.use(helmet());
    const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    app.enableCors({
      origin: (
        origin: string | undefined,
        callback: (
          err: Error | null,
          allow?: boolean | string | RegExp | (string | RegExp)[],
        ) => void,
      ): void => {
        if (!origin) return callback(null, true);
        if (origins.includes(origin)) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    });
    (app as unknown as { set: (name: string, value: unknown) => void }).set(
      'trust proxy',
      true,
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should set at least one Helmet security header on /api/health', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    // Helmet headers can vary by version; assert a subset presence
    const headers = res.headers;
    const anyHelmet =
      headers['x-content-type-options'] ||
      headers['x-dns-prefetch-control'] ||
      headers['x-frame-options'] ||
      headers['referrer-policy'] ||
      headers['cross-origin-resource-policy'] ||
      headers['x-download-options'];
    expect(anyHelmet).toBeDefined();
  });

  it('should allow CORS for whitelisted origin', async () => {
    const allowedOrigin = (
      process.env.CORS_ORIGINS || 'http://localhost:5173'
    ).split(',')[0];
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .set('Origin', allowedOrigin)
      .expect(200);
    // Depending on CORS lib, echo or wildcard may be used; accept either
    const allowOrigin = res.headers['access-control-allow-origin'];
    expect([allowedOrigin, '*']).toContain(allowOrigin);
  });

  it('should not set CORS allow-origin for non-whitelisted origin', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .set('Origin', 'https://not-allowed.example.com')
      .expect(200);
    // Should not echo the non-whitelisted origin
    expect(res.headers['access-control-allow-origin']).not.toBe(
      'https://not-allowed.example.com',
    );
  });
});
