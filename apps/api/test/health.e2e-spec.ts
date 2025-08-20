import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import helmet from 'helmet';

describe('HealthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(helmet());
    // make test consistent with production setup for CORS
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
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('uptime');
        expect(res.body).toHaveProperty('environment');
        expect(typeof res.body.timestamp).toBe('string');
        expect(typeof res.body.uptime).toBe('number');
        expect(typeof res.body.environment).toBe('string');
        // Helmet should set at least content-type options in our setup
        expect(
          res.headers['x-content-type-options'] ||
            res.headers['x-dns-prefetch-control'] ||
            res.headers['x-frame-options'],
        ).toBeDefined();
      });
  });
});
