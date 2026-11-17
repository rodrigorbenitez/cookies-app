import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { BadRequestError } from '../lib/errors.js';
import { processAndStoreImage } from '../lib/images.js';

export const uploadRoutes = new Hono();

uploadRoutes.post(
  '/',
  bodyLimit({
    maxSize: 25 * 1024 * 1024,
    onError: (c) => c.json({ error: 'Image is too large (max 25 MB)' }, 413),
  }),
  async (c) => {
    const body = await c.req.parseBody();
    const file = body.image;
    if (!(file instanceof File) || file.size === 0) throw new BadRequestError('No image uploaded');
    const name = await processAndStoreImage(Buffer.from(await file.arrayBuffer()));
    return c.json({ imagePath: name }, 201);
  },
);
