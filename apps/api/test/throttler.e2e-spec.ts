import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Throttler (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    // simulate trusted proxy in tests
    // trust proxy for proper X-Forwarded-For handling
    (app as unknown as { set: (name: string, value: unknown) => void }).set(
      'trust proxy',
      true,
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should allow requests within rate limit', async () => {
    // Faire 5 requêtes (bien en dessous de la limite de 100)
    for (let i = 0; i < 5; i++) {
      const response = await request(app.getHttpServer())
        .get('/api/')
        .expect(200);

      expect(response.text).toBe('Hello World!');
    }
  });

  it('should return 429 when rate limit is exceeded', async () => {
    // Faire des requêtes séquentielles pour dépasser la limite
    let blockedRequest = null;

    // Faire 110 requêtes séquentielles
    for (let i = 0; i < 110; i++) {
      try {
        const response = await request(app.getHttpServer()).get('/api/');

        if (response.status === 429) {
          blockedRequest = response;
          break;
        }
      } catch (error: any) {
        if (error.status === 429) {
          blockedRequest = error;
          break;
        }
      }
    }

    // Vérifier qu'au moins une requête a été bloquée
    expect(blockedRequest).not.toBeNull();
    expect(blockedRequest.status).toBe(429);

    // Vérifier le format de l'erreur 429
    expect(blockedRequest.body).toHaveProperty('message');
    expect(blockedRequest.body).toHaveProperty('statusCode', 429);
    expect(blockedRequest.body.message).toContain('ThrottlerException');
  });

  it('should track rate limit by IP address', async () => {
    // Simuler des requêtes depuis différentes IPs
    const ip1 = '192.168.1.1';
    const ip2 = '192.168.1.2';

    // IP1 fait 50 requêtes
    for (let i = 0; i < 50; i++) {
      await request(app.getHttpServer())
        .get('/api/')
        .set('X-Forwarded-For', ip1)
        .expect(200);
    }

    // IP2 fait 50 requêtes (devrait aussi réussir)
    for (let i = 0; i < 50; i++) {
      await request(app.getHttpServer())
        .get('/api/')
        .set('X-Forwarded-For', ip2)
        .expect(200);
    }

    // IP1 fait encore 60 requêtes séquentielles (devrait dépasser la limite)
    let blockedRequest = null;
    for (let i = 0; i < 60; i++) {
      try {
        const response = await request(app.getHttpServer())
          .get('/api/')
          .set('X-Forwarded-For', ip1);

        if (response.status === 429) {
          blockedRequest = response;
          break;
        }
      } catch (error: any) {
        if (error.status === 429) {
          blockedRequest = error;
          break;
        }
      }
    }

    expect(blockedRequest).not.toBeNull();
    expect(blockedRequest.status).toBe(429);
  });
});
