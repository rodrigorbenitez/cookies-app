import { defineConfig } from 'drizzle-kit';

// Only used by `drizzle-kit generate`, which does not need a database connection.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
});
