import { DataSource } from 'typeorm';
import 'dotenv/config';

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

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: db.host,
  port: db.port,
  username: db.username,
  password: db.password,
  database: db.database,
  ssl: db.ssl as unknown as boolean | { rejectUnauthorized: boolean },
  migrations: [__dirname + '/migrations/*.ts'],
});
export default AppDataSource;
