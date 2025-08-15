import { spawn } from 'node:child_process';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_USERNAME = process.env.DB_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'vitavet';

console.log(`Resetting database schema on ${DB_HOST}:${DB_PORT}/${DB_NAME} ...`);

const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
const sql = `DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;`;

const args = [
  '-h', DB_HOST,
  '-p', DB_PORT,
  '-U', DB_USERNAME,
  '-d', DB_NAME,
  '-v', 'ON_ERROR_STOP=1',
  '-c', sql,
];

const cmd = spawn('psql', args, { env, stdio: 'inherit', shell: process.platform === 'win32' });

cmd.on('exit', (code) => {
  if (code === 0) {
    console.log('Database reset completed (schema dropped and recreated).');
  } else {
    console.error(`psql exited with code ${code}`);
    process.exit(code ?? 1);
  }
});

