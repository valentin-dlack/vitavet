import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
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
    // Setup Swagger for tests (e2e does not use main.ts)
    const swaggerConfig = new DocumentBuilder()
      .setTitle('VitaVet API')
      .setDescription('API documentation for VitaVet')
      .setVersion('1.0')
      .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, swaggerDocument);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/docs (GET) should serve Swagger UI', async () => {
    const res = await request(app.getHttpServer()).get('/api/docs').expect(200);
    const contentType = res.headers['content-type'];
    expect(contentType).toMatch(/text\/html|application\/json/);
  });
});
