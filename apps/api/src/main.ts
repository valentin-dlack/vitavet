import './env';
import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';

// env loaded by src/env.ts

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Security headers
  app.use(helmet());

  // Respect X-Forwarded-For for rate limiting and logging behind proxies
  // Express-specific setting is available through Nest's adapter
  app.set('trust proxy', true);

  // CORS configuration (restrict by environment variable). If CORS_ORIGINS="*", allow all origins.
  const corsEnv = process.env.CORS_ORIGINS || 'http://localhost:5173';
  const allowAllOrigins = corsEnv.trim() === '*';
  const origins = (allowAllOrigins ? '' : corsEnv)
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
      // Allow requests without Origin (e.g., curl, tests)
      if (!origin) {
        return callback(null, true);
      }
      if (allowAllOrigins || origins.includes(origin)) {
        return callback(null, true);
      }
      // Disallow by omitting CORS headers
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  });

  // Global prefix
  app.setGlobalPrefix('api'); // => /api/*

  // Swagger (OpenAPI) minimal setup for docs on /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('VitaVet API')
    .setDescription('API documentation for VitaVet')
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT || 3000);
}
void bootstrap();
