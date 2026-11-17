import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { BadRequestError } from '../lib/errors.js';
import { backupSchema, exportAll, importAll } from '../services/backup.js';

export const backupRoutes = new Hono();

backupRoutes.get('/export', async (c) => {
  const data = await exportAll();
  const date = new Date().toISOString().slice(0, 10);
  c.header('Content-Disposition', `attachment; filename="cookbook-backup-${date}.json"`);
  return c.json(data);
});

backupRoutes.post(
  '/import',
  bodyLimit({
    maxSize: 500 * 1024 * 1024,
    onError: (c) => c.json({ error: 'Backup file is too large' }, 413),
  }),
  async (c) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      throw new BadRequestError('The file is not valid JSON');
    }
    const parsed = backupSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestError('The file is not a cookbook backup');
    const keepDuplicates = c.req.query('duplicates') === 'keep';
    return c.json(await importAll(parsed.data, keepDuplicates));
  },
);
