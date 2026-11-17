import fs from 'node:fs/promises';
import { asc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { CATEGORIES, ingredientCatalog, recipes } from '../db/schema.js';
import { imageFilePath, processAndStoreImage } from '../lib/images.js';
import { getOrCreateCatalogEntry } from './catalog.js';
import { createRecipe, getRecipe, groupInput } from './recipes.js';

export const BACKUP_FORMAT = 'cookies-app-backup';

export async function exportAll() {
  const catalog = await db
    .select({ name: ingredientCatalog.name, category: ingredientCatalog.category })
    .from(ingredientCatalog)
    .orderBy(asc(ingredientCatalog.name));
  const ids = await db.select({ id: recipes.id }).from(recipes).orderBy(asc(recipes.id));

  const out = [];
  for (const { id } of ids) {
    const r = (await getRecipe(id))!;
    let image: { mimeType: string; data: string } | null = null;
    if (r.imagePath) {
      try {
        const data = await fs.readFile(imageFilePath(r.imagePath));
        image = { mimeType: 'image/webp', data: data.toString('base64') };
      } catch {
        image = null; // file missing on disk: export the recipe without it
      }
    }
    out.push({
      title: r.title,
      tags: r.tags,
      rating: r.rating,
      servings: r.servings,
      prepTime: r.prepTime,
      instructions: r.instructions,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      image,
      ingredientGroups: r.ingredientGroups.map((g) => ({
        name: g.name,
        ingredients: g.ingredients.map((i) => ({ amount: i.amount, unit: i.unit, name: i.name, note: i.note })),
      })),
    });
  }
  return { format: BACKUP_FORMAT, version: 1, exportedAt: new Date().toISOString(), catalog, recipes: out };
}

const importRecipe = z.object({
  title: z.string().trim().min(1).max(200),
  tags: z.array(z.string()).default([]),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  servings: z.number().int().min(1).max(500).default(4),
  prepTime: z.number().int().min(0).nullable().optional(),
  instructions: z.string().default(''),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  image: z.object({ mimeType: z.string(), data: z.string() }).nullable().optional(),
  ingredientGroups: z.array(groupInput).default([]),
});

export const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.number().int(),
  catalog: z.array(z.object({ name: z.string().trim().min(1), category: z.enum(CATEGORIES) })).default([]),
  recipes: z.array(importRecipe),
});

/** Imports recipes as new entries. Recipes whose title already exists are skipped unless `keepDuplicates`. */
export async function importAll(data: z.infer<typeof backupSchema>, keepDuplicates = false) {
  for (const entry of data.catalog) {
    const existing = await getOrCreateCatalogEntry(db, entry.name, entry.category);
    if (existing.category === 'other' && entry.category !== 'other') {
      await db
        .update(ingredientCatalog)
        .set({ category: entry.category })
        .where(sql`${ingredientCatalog.id} = ${existing.id}`);
    }
  }

  const existingTitles = new Set(
    (await db.select({ title: recipes.title }).from(recipes)).map((r) => r.title.toLowerCase()),
  );
  let imported = 0;
  let skipped = 0;
  for (const r of data.recipes) {
    if (!keepDuplicates && existingTitles.has(r.title.toLowerCase())) {
      skipped++;
      continue;
    }
    let imagePath: string | null = null;
    if (r.image?.data) {
      try {
        imagePath = await processAndStoreImage(Buffer.from(r.image.data, 'base64'));
      } catch {
        imagePath = null;
      }
    }
    await createRecipe(
      {
        title: r.title,
        imagePath,
        tags: r.tags,
        rating: r.rating ?? null,
        servings: r.servings,
        prepTime: r.prepTime ?? null,
        instructions: r.instructions,
        ingredientGroups: r.ingredientGroups,
      },
      { createdAt: r.createdAt, updatedAt: r.updatedAt },
    );
    existingTitles.add(r.title.toLowerCase());
    imported++;
  }
  return { imported, skipped };
}
