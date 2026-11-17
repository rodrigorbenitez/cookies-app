import { and, asc, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { db, type DB } from '../db/client.js';
import {
  UNITS,
  ingredientCatalog,
  ingredientGroups,
  ingredients,
  recipes,
} from '../db/schema.js';
import { extractTags, normalizeTags } from '../lib/tags.js';
import { isValidImageName } from '../lib/images.js';
import { getOrCreateCatalogEntry } from './catalog.js';

type Tx = Parameters<Parameters<DB['transaction']>[0]>[0];

export const ingredientInput = z.object({
  amount: z.number().positive().finite().nullable().optional(),
  unit: z.enum(UNITS),
  name: z.string().trim().min(1).max(120),
  note: z.string().trim().max(200).nullable().optional(),
});

export const groupInput = z.object({
  name: z.string().trim().max(80).default(''),
  ingredients: z.array(ingredientInput).max(200).default([]),
});

export const recipeInput = z.object({
  title: z.string().trim().min(1).max(200),
  imagePath: z
    .string()
    .refine(isValidImageName, 'Invalid image')
    .nullable()
    .optional(),
  tags: z.array(z.string().max(60)).max(50).default([]),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  servings: z.number().int().min(1).max(500).default(4),
  prepTime: z.number().int().min(0).max(100_000).nullable().optional(),
  instructions: z.string().max(100_000).default(''),
  ingredientGroups: z.array(groupInput).max(50).default([]),
});
export type RecipeInput = z.infer<typeof recipeInput>;

export const listQuery = z.object({
  q: z.string().trim().max(200).optional(),
  tags: z
    .string()
    .optional()
    .transform((v) => (v ? normalizeTags(v.split(',')) : [])),
  minRating: z.coerce.number().int().min(1).max(5).optional(),
  ingredient: z.string().trim().max(120).optional(),
  sort: z.enum(['name', 'rating', 'recent']).default('recent'),
});
export type ListQuery = z.infer<typeof listQuery>;

/** Builds a prefix-matching tsquery from free text: "choc cook" -> "choc:* & cook:*". */
export function toPrefixTsQuery(text: string): string | null {
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean);
  if (!words.length) return null;
  return words.map((w) => `${w}:*`).join(' & ');
}

const summaryColumns = {
  id: recipes.id,
  title: recipes.title,
  imagePath: recipes.imagePath,
  tags: recipes.tags,
  rating: recipes.rating,
  servings: recipes.servings,
  prepTime: recipes.prepTime,
  createdAt: recipes.createdAt,
  updatedAt: recipes.updatedAt,
};

export async function listRecipes(query: ListQuery) {
  const where: SQL[] = [];
  const tsq = query.q ? toPrefixTsQuery(query.q) : null;
  if (tsq) where.push(sql`${recipes.searchVector} @@ to_tsquery('simple', ${tsq})`);
  if (query.tags.length) {
    where.push(sql`${recipes.tags} @> ARRAY[${sql.join(query.tags.map((t) => sql`${t}`), sql`, `)}]::text[]`);
  }
  if (query.minRating) where.push(sql`${recipes.rating} >= ${query.minRating}`);
  if (query.ingredient) {
    where.push(sql`EXISTS (
      SELECT 1 FROM ingredients i
      JOIN ingredient_groups g ON g.id = i.group_id
      JOIN ingredient_catalog c ON c.id = i.catalog_id
      WHERE g.recipe_id = "recipes"."id" AND c.name ILIKE ${'%' + escapeLike(query.ingredient) + '%'}
    )`);
  }

  const order =
    query.sort === 'name'
      ? [asc(sql`lower(${recipes.title})`)]
      : query.sort === 'rating'
        ? [sql`${recipes.rating} DESC NULLS LAST`, asc(sql`lower(${recipes.title})`)]
        : [desc(recipes.createdAt), desc(recipes.id)];

  return db
    .select(summaryColumns)
    .from(recipes)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...order);
}

function escapeLike(s: string) {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

export async function getRecipe(id: number, tx: Tx | DB = db) {
  const [recipe] = await tx
    .select({ ...summaryColumns, instructions: recipes.instructions })
    .from(recipes)
    .where(eq(recipes.id, id));
  if (!recipe) return null;

  const groups = await tx
    .select()
    .from(ingredientGroups)
    .where(eq(ingredientGroups.recipeId, id))
    .orderBy(asc(ingredientGroups.position), asc(ingredientGroups.id));

  const rows = groups.length
    ? await tx
        .select({
          id: ingredients.id,
          groupId: ingredients.groupId,
          amount: ingredients.amount,
          unit: ingredients.unit,
          note: ingredients.note,
          position: ingredients.position,
          catalogId: ingredientCatalog.id,
          name: ingredientCatalog.name,
          category: ingredientCatalog.category,
        })
        .from(ingredients)
        .innerJoin(ingredientCatalog, eq(ingredientCatalog.id, ingredients.catalogId))
        .where(inArray(ingredients.groupId, groups.map((g) => g.id)))
        .orderBy(asc(ingredients.position), asc(ingredients.id))
    : [];

  return {
    ...recipe,
    ingredientGroups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      position: g.position,
      ingredients: rows
        .filter((r) => r.groupId === g.id)
        .map(({ groupId: _groupId, ...r }) => r),
    })),
  };
}
export type RecipeDetail = NonNullable<Awaited<ReturnType<typeof getRecipe>>>;

/** Recomputes the full-text search vector (title, tags, ingredients, instructions). */
export async function refreshSearchVector(tx: Tx | DB, recipeIds?: number[]) {
  const filter = recipeIds ? sql`WHERE r.id IN (${sql.join(recipeIds.map((i) => sql`${i}`), sql`, `)})` : sql``;
  if (recipeIds && !recipeIds.length) return;
  await tx.execute(sql`
    UPDATE recipes r SET search_vector =
      setweight(to_tsvector('simple', coalesce(r.title, '')), 'A') ||
      setweight(to_tsvector('simple', array_to_string(r.tags, ' ')), 'A') ||
      setweight(to_tsvector('simple', coalesce((
        SELECT string_agg(c.name || ' ' || coalesce(i.note, ''), ' ')
        FROM ingredients i
        JOIN ingredient_groups g ON g.id = i.group_id
        JOIN ingredient_catalog c ON c.id = i.catalog_id
        WHERE g.recipe_id = r.id
      ), '')), 'B') ||
      setweight(to_tsvector('simple', coalesce(r.instructions, '')), 'C')
    ${filter}
  `);
}

async function writeGroups(tx: Tx, recipeId: number, groups: RecipeInput['ingredientGroups']) {
  await tx.delete(ingredientGroups).where(eq(ingredientGroups.recipeId, recipeId));
  for (const [gi, group] of groups.entries()) {
    const [g] = await tx
      .insert(ingredientGroups)
      .values({ recipeId, name: group.name, position: gi })
      .returning({ id: ingredientGroups.id });
    const rows = [];
    for (const [ii, ing] of group.ingredients.entries()) {
      const entry = await getOrCreateCatalogEntry(tx, ing.name);
      rows.push({
        groupId: g.id,
        catalogId: entry.id,
        amount: ing.unit === 'to taste' ? null : (ing.amount ?? null),
        unit: ing.unit,
        note: ing.note || null,
        position: ii,
      });
    }
    if (rows.length) await tx.insert(ingredients).values(rows);
  }
}

function recipeValues(input: RecipeInput) {
  // Tags typed in the tag field plus any #tags written in the instructions.
  const tags = normalizeTags([...input.tags, ...extractTags(input.instructions)]);
  return {
    title: input.title,
    imagePath: input.imagePath ?? null,
    tags,
    rating: input.rating ?? null,
    servings: input.servings,
    prepTime: input.prepTime ?? null,
    instructions: input.instructions,
  };
}

export async function createRecipe(input: RecipeInput, extra?: { createdAt?: Date; updatedAt?: Date }) {
  return db.transaction(async (tx) => {
    const [r] = await tx
      .insert(recipes)
      .values({ ...recipeValues(input), ...extra })
      .returning({ id: recipes.id });
    await writeGroups(tx, r.id, input.ingredientGroups);
    await refreshSearchVector(tx, [r.id]);
    return (await getRecipe(r.id, tx))!;
  });
}

/** Returns the updated recipe and the previous image path (so the caller can delete it). */
export async function updateRecipe(id: number, input: RecipeInput) {
  return db.transaction(async (tx) => {
    const [prev] = await tx
      .select({ imagePath: recipes.imagePath })
      .from(recipes)
      .where(eq(recipes.id, id))
      .for('update');
    if (!prev) return null;
    await tx
      .update(recipes)
      .set({ ...recipeValues(input), updatedAt: new Date() })
      .where(eq(recipes.id, id));
    await writeGroups(tx, id, input.ingredientGroups);
    await refreshSearchVector(tx, [id]);
    return { recipe: (await getRecipe(id, tx))!, previousImage: prev.imagePath };
  });
}

export async function setRating(id: number, rating: number | null) {
  const [r] = await db
    .update(recipes)
    .set({ rating, updatedAt: new Date() })
    .where(eq(recipes.id, id))
    .returning({ id: recipes.id, rating: recipes.rating });
  return r ?? null;
}

export async function deleteRecipe(id: number) {
  const [r] = await db
    .delete(recipes)
    .where(eq(recipes.id, id))
    .returning({ imagePath: recipes.imagePath });
  return r ?? null;
}

export async function listTags() {
  const rows = await db.execute<{ tag: string; count: number }>(sql`
    SELECT tag, count(*)::int AS count
    FROM recipes, unnest(tags) AS tag
    GROUP BY tag
    ORDER BY count DESC, tag ASC
  `);
  return [...rows];
}

export async function allImagePaths() {
  const rows = await db.select({ imagePath: recipes.imagePath }).from(recipes);
  return new Set(rows.map((r) => r.imagePath).filter((p): p is string => !!p));
}
