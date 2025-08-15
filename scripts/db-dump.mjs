import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_USERNAME = process.env.DB_USERNAME || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'vitavet';

const dumpsDir = join(process.cwd(), 'data', 'dumps');
if (!existsSync(dumpsDir)) {
  mkdirSync(dumpsDir, { recursive: true });
}

const timestamp = new Date()
  .toISOString()
  .replace(/[:T]/g, '-')
  .split('.')[0]
  .replace(/Z$/, '');
const outfile = join(dumpsDir, `vitavet-${timestamp}.sql`);

console.log(`Dumping database to ${outfile} ...`);

const env = { ...process.env, PGPASSWORD: DB_PASSWORD };
const args = [
  `-h`, DB_HOST,
  `-p`, DB_PORT,
  `-U`, DB_USERNAME,
  `-Fc`, // custom format (compressed). Use -f with .dump, but we will output plain SQL for portability
  `-f`, outfile,
  DB_NAME,
];

// Use plain SQL instead of custom format if preferred
// Replace -Fc with -F p if needed
args[6] = '-F';
args[7] = 'p';

const cmd = spawn('pg_dump', args, { env, stdio: 'inherit', shell: process.platform === 'win32' });

cmd.on('exit', (code) => {
  if (code === 0) {
    console.log('Database dump completed.');
  } else {
    console.error(`pg_dump exited with code ${code}`);
    process.exit(code ?? 1);
  }
});

