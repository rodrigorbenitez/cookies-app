import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from '../config.js';
import * as schema from './schema.js';
import { cleanDatabaseUrl } from './url.js';

export const sqlClient = postgres(cleanDatabaseUrl(config.databaseUrl), {
  max: 10,
  onnotice: () => {},
});

export const db = drizzle(sqlClient, { schema });
export type DB = typeof db;
