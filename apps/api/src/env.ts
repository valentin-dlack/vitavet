import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment from monorepo root if present, then allow local .env to override
dotenv.config({ path: join(process.cwd(), '../../.env') });
dotenv.config({ override: true });
