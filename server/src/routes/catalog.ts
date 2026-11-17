import { Hono } from 'hono';
import { z } from 'zod';
import { asc, eq, sql } from 'drizzle-orm';
import { db } from '../db/client.js';
import { CATEGORIES, ingredientCatalog, ingredientGroups, ingredients } from '../db/schema.js';
import { BadRequestError, NotFoundError } from '../lib/errors.js';
import { cleanIngredientName } from '../services/catalog.js';
import { refreshSearchVector } from '../services/recipes.js';

export const catalogRoutes = new Hono();

catalogRoutes.get('/', async (c) => {
  const rows = await db
    .select({
      id: ingredientCatalog.id,
      name: ingredientCatalog.name,
      category: ingredientCatalog.category,
      usage: sql<number>`(SELECT count(*)::int FROM ingredients i WHERE i.catalog_id = "ingredient_catalog"."id")`,
    })
    .from(ingredientCatalog)
    .orderBy(asc(sql`lower(${ingredientCatalog.name})`));
  return c.json(rows);
});

const patchInput = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  category: z.enum(CATEGORIES).optional(),
});

catalogRoutes.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const input = patchInput.parse(await c.req.json());
  const values: Partial<typeof ingredientCatalog.$inferInsert> = {};
  if (input.name) values.name = cleanIngredientName(input.name);
  if (input.category) values.category = input.category;
  if (!Object.keys(values).length) throw new BadRequestError('Nothing to update');

  const updated = await db.transaction(async (tx) => {
    if (values.name) {
      const [clash] = await tx
        .select({ id: ingredientCatalog.id })
        .from(ingredientCatalog)
        .where(sql`lower(${ingredientCatalog.name}) = lower(${values.name}) AND ${ingredientCatalog.id} <> ${id}`);
      if (clash) throw new BadRequestError('An ingredient with this name already exists');
    }
    const [row] = await tx.update(ingredientCatalog).set(values).where(eq(ingredientCatalog.id, id)).returning();
    if (!row) return null;
    if (values.name) {
      const affected = await tx
        .selectDistinct({ id: ingredientGroups.recipeId })
        .from(ingredients)
        .innerJoin(ingredientGroups, eq(ingredientGroups.id, ingredients.groupId))
        .where(eq(ingredients.catalogId, id));
      await refreshSearchVector(tx, affected.map((a) => a.id));
    }
    return row;
  });
  if (!updated) throw new NotFoundError('Ingredient not found');
  return c.json(updated);
});

catalogRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ingredients)
    .where(eq(ingredients.catalogId, id));
  if (count > 0) throw new BadRequestError('This ingredient is still used in recipes');
  const [row] = await db.delete(ingredientCatalog).where(eq(ingredientCatalog.id, id)).returning();
  if (!row) throw new NotFoundError('Ingredient not found');
  return c.body(null, 204);
});
