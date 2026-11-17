import { Hono } from 'hono';
import { NotFoundError } from '../lib/errors.js';
import {
  addManualItem,
  clearAll,
  clearChecked,
  deleteItem,
  generateInput,
  generateShoppingList,
  getShoppingList,
  itemPatchInput,
  manualItemInput,
  updateItem,
} from '../services/shopping.js';

export const shoppingRoutes = new Hono();

const idParam = (raw: string) => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError('Item not found');
  return id;
};

shoppingRoutes.get('/', async (c) => c.json(await getShoppingList()));

shoppingRoutes.post('/generate', async (c) => {
  const input = generateInput.parse(await c.req.json());
  return c.json(await generateShoppingList(input));
});

shoppingRoutes.post('/items', async (c) => {
  const input = manualItemInput.parse(await c.req.json());
  return c.json(await addManualItem(input), 201);
});

shoppingRoutes.patch('/items/:id', async (c) => {
  const patch = itemPatchInput.parse(await c.req.json());
  const item = await updateItem(idParam(c.req.param('id')), patch);
  if (!item) throw new NotFoundError('Item not found');
  return c.json(item);
});

shoppingRoutes.delete('/items/:id', async (c) => {
  const item = await deleteItem(idParam(c.req.param('id')));
  if (!item) throw new NotFoundError('Item not found');
  return c.body(null, 204);
});

shoppingRoutes.post('/clear-checked', async (c) => c.json(await clearChecked()));

shoppingRoutes.delete('/', async (c) => c.json(await clearAll()));
