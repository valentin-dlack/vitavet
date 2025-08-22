/* eslint-disable @typescript-eslint/no-require-imports */
import { databaseConfig } from './database.config';

describe('database.config', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.DATABASE_URL;
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    delete process.env.DB_SYNCHRONIZE;
    delete process.env.NODE_ENV;
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('defaults to local settings in dev', () => {
    process.env.NODE_ENV = 'test';
    const cfg = databaseConfig;
    expect(cfg.host).toBeDefined();
    expect(cfg.ssl).toBe(false);
    // synchronize true in non-production by default
    expect(cfg.synchronize).toBe(true);
  });

  it('parses DATABASE_URL with ssl in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgres://user:pass@host:6543/dbname';
    // re-import to rebuild config with env

    const fresh =
      require('./database.config') as typeof import('./database.config');
    const cfg = fresh.databaseConfig;
    expect(cfg.port).toBe(6543);
    expect(cfg.username).toBe('user');
    expect(cfg.password).toBe('pass');
    expect(cfg.database).toBe('dbname');
    expect(cfg.ssl).toEqual({ rejectUnauthorized: false });
    // synchronize false by default in production
    expect(cfg.synchronize).toBe(false);
  });

  it('respects DB_SYNCHRONIZE override', () => {
    process.env.NODE_ENV = 'production';
    process.env.DB_SYNCHRONIZE = 'true';

    const fresh =
      require('./database.config') as typeof import('./database.config');
    const cfg = fresh.databaseConfig;
    expect(cfg.synchronize).toBe(true);
  });
});
