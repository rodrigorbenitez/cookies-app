import fs from 'node:fs/promises';
import { Hono } from 'hono';
import { NotFoundError } from '../lib/errors.js';
import { isValidImageName, imageFilePath } from '../lib/images.js';

export const imageRoutes = new Hono();

imageRoutes.get('/:file', async (c) => {
  const file = c.req.param('file');
  if (!isValidImageName(file)) throw new NotFoundError();
  try {
    const data = await fs.readFile(imageFilePath(file));
    return c.body(data, 200, {
      'Content-Type': 'image/webp',
      // File names are random and never reused, so they can be cached forever.
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
  } catch {
    throw new NotFoundError('Image not found');
  }
});
