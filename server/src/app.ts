import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { compress } from 'hono/compress';
import { secureHeaders } from 'hono/secure-headers';
import { sql } from 'drizzle-orm';
import { db } from './db/client.js';
import { handleError } from './lib/errors.js';
import { imageRoutes } from './routes/images.js';
import { recipeRoutes } from './routes/recipes.js';
import { uploadRoutes } from './routes/uploads.js';
import { tagRoutes } from './routes/tags.js';
import { catalogRoutes } from './routes/catalog.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(here, '../../client/dist');

export function createApp() {
  const app = new Hono();
  app.onError(handleError);
  app.use('*', secureHeaders({ crossOriginResourcePolicy: 'same-origin' }));

  const api = new Hono();
  api.use('*', async (c, next) => {
    await next();
    if (!c.res.headers.has('Cache-Control')) c.header('Cache-Control', 'no-store');
  });

  api.get('/health', async (c) => {
    try {
      await db.execute(sql`select 1`);
      return c.json({ status: 'ok' });
    } catch {
      return c.json({ status: 'unavailable' }, 503);
    }
  });

  api.route('/images', imageRoutes);
  api.route('/recipes', recipeRoutes);
  api.route('/uploads', uploadRoutes);
  api.route('/tags', tagRoutes);
  api.route('/catalog', catalogRoutes);
  app.route('/api', api);
  app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404));

  // Built frontend (single Railway service serves both).
  if (fs.existsSync(clientDist)) {
    app.use('*', compress());
    app.use(
      '/assets/*',
      serveStatic({
        root: clientDist,
        onFound: (_path, c) => c.header('Cache-Control', 'public, max-age=31536000, immutable'),
      }),
    );
    app.use('*', serveStatic({ root: clientDist }));
    // SPA fallback for client-side routes.
    const indexHtml = fs.readFileSync(path.join(clientDist, 'index.html'), 'utf8');
    app.get('*', (c) => {
      c.header('Cache-Control', 'no-cache');
      return c.html(indexHtml);
    });
  }

  return app;
}
