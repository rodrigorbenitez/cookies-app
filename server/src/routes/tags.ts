import { Hono } from 'hono';
import { listTags } from '../services/recipes.js';

export const tagRoutes = new Hono();

tagRoutes.get('/', async (c) => c.json(await listTags()));
