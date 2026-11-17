import { Hono } from 'hono';
import { z } from 'zod';
import { BadRequestError, NotFoundError } from '../lib/errors.js';
import { deleteImage } from '../lib/images.js';
import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  listQuery,
  listRecipes,
  recipeInput,
  setRating,
  updateRecipe,
} from '../services/recipes.js';

export const recipeRoutes = new Hono();

function parseId(raw: string) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError('Recipe not found');
  return id;
}

async function jsonBody(c: { req: { json: () => Promise<unknown> } }) {
  try {
    return await c.req.json();
  } catch {
    throw new BadRequestError('Expected a JSON body');
  }
}

recipeRoutes.get('/', async (c) => {
  const query = listQuery.parse(c.req.query());
  return c.json(await listRecipes(query));
});

recipeRoutes.get('/:id', async (c) => {
  const recipe = await getRecipe(parseId(c.req.param('id')));
  if (!recipe) throw new NotFoundError('Recipe not found');
  return c.json(recipe);
});

recipeRoutes.post('/', async (c) => {
  const input = recipeInput.parse(await jsonBody(c));
  return c.json(await createRecipe(input), 201);
});

recipeRoutes.put('/:id', async (c) => {
  const id = parseId(c.req.param('id'));
  const input = recipeInput.parse(await jsonBody(c));
  const result = await updateRecipe(id, input);
  if (!result) throw new NotFoundError('Recipe not found');
  if (result.previousImage && result.previousImage !== result.recipe.imagePath) {
    await deleteImage(result.previousImage);
  }
  return c.json(result.recipe);
});

recipeRoutes.patch('/:id/rating', async (c) => {
  const id = parseId(c.req.param('id'));
  const { rating } = z
    .object({ rating: z.number().int().min(1).max(5).nullable() })
    .parse(await jsonBody(c));
  const r = await setRating(id, rating);
  if (!r) throw new NotFoundError('Recipe not found');
  return c.json(r);
});

recipeRoutes.delete('/:id', async (c) => {
  const r = await deleteRecipe(parseId(c.req.param('id')));
  if (!r) throw new NotFoundError('Recipe not found');
  await deleteImage(r.imagePath);
  return c.body(null, 204);
});
