import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './client.js';

const here = path.dirname(fileURLToPath(import.meta.url));
// Works from both src/db (tsx) and dist/db (compiled): the folder lives at server/drizzle.
const migrationsFolder = path.resolve(here, '../../drizzle');

export async function runMigrations() {
  await migrate(db, { migrationsFolder });
}
