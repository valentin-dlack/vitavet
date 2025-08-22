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

  // Swagger (OpenAPI) setup for docs on /api/docs
  const swaggerConfig = new DocumentBuilder()
    .setTitle('VitaVet API')
    .setDescription(
      `# VitaVet API Documentation

API REST pour la gestion de cliniques vétérinaires et de rendez-vous.

## Authentification
L'API utilise l'authentification JWT Bearer Token. Incluez le token dans l'en-tête Authorization :
\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

## Rôles utilisateur
- **OWNER** : Propriétaire d'animaux
- **VET** : Vétérinaire
- **ASV** : Assistant vétérinaire
- **ADMIN_CLINIC** : Administrateur de clinique
- **WEBMASTER** : Administrateur système

## Codes de statut
- 200 : Succès
- 201 : Créé
- 204 : Pas de contenu
- 400 : Requête invalide
- 401 : Non authentifié
- 403 : Non autorisé
- 404 : Non trouvé
- 500 : Erreur serveur`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtenu via /auth/login',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentification et gestion de profil utilisateur')
    .addTag('clinics', 'Gestion des cliniques vétérinaires')
    .addTag('appointments', 'Gestion des rendez-vous')
    .addTag('animals', 'Gestion des animaux')
    .addTag('slots', 'Gestion des créneaux disponibles')
    .addTag('agenda', 'Agenda des vétérinaires')
    .addTag('documents', 'Gestion des documents')
    .addTag('reminders', 'Gestion des rappels')
    .addTag('notifications', 'Gestion des notifications')
    .addTag('admin', 'Administration système')
    .addTag('health', "Santé de l'API")
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
