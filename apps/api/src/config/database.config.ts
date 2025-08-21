import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { NotificationLog } from '../notifications/entities/notification-log.entity';

// Build DB connection params, supporting either discrete vars or DATABASE_URL
const buildDbParams = () => {
  const fromUrl = process.env.DATABASE_URL;
  if (fromUrl) {
    try {
      const url = new URL(fromUrl);
      const host = url.hostname;
      const port = parseInt(url.port || '5432');
      const username = decodeURIComponent(url.username || '');
      const password = decodeURIComponent(url.password || '');
      const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
      // In production (Railway), enable SSL but allow self-signed
      const ssl =
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false;
      return { host, port, username, password, database, ssl };
    } catch {
      // Fallback to discrete variables on parse error
    }
  }

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '5432');
  const username = process.env.DB_USERNAME || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const database = process.env.DB_NAME || 'vitavet';
  const ssl =
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false;
  return { host, port, username, password, database, ssl };
};

const db = buildDbParams();

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: db.host,
  port: db.port,
  username: db.username,
  password: db.password,
  database: db.database,
  entities: [User, NotificationLog],
  synchronize: process.env.NODE_ENV !== 'production', // Auto-create tables in development
  logging: process.env.NODE_ENV !== 'production',
  ssl: db.ssl,
};
