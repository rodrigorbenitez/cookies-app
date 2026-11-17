import { serve } from '@hono/node-server';
import { config } from './config.js';
import { runMigrations } from './db/migrate.js';
import { createApp } from './app.js';
import { ensureUploadDir } from './lib/images.js';

async function main() {
  console.log('Running database migrations…');
  await runMigrations();
  console.log('Migrations complete.');
  await ensureUploadDir();

  const app = createApp();
  serve({ fetch: app.fetch, port: config.port, hostname: '0.0.0.0' }, (info) => {
    console.log(`Server listening on 0.0.0.0:${info.port}`);
  });
}

main().catch((err) => {
  // Only the message: never print configuration or connection strings.
  console.error('Startup failed:', err instanceof Error ? err.message : 'unknown error');
  process.exit(1);
});
