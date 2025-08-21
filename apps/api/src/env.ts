import * as dotenv from 'dotenv';
import { join } from 'path';

// In production (Railway), rely on real environment variables only
if (process.env.NODE_ENV !== 'production') {
  // Load environment from monorepo root if present, then allow local .env to override
  dotenv.config({ path: join(process.cwd(), '../../.env') });
  dotenv.config({ override: true });
}
