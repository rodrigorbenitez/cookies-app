import { sql } from 'drizzle-orm';
import type { Category } from '../db/schema.js';
import { ingredientCatalog } from '../db/schema.js';
import { guessCategory } from '../lib/categories.js';
import type { DB } from '../db/client.js';

type Tx = Parameters<Parameters<DB['transaction']>[0]>[0] | DB;

export function cleanIngredientName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

/** Returns the catalog id for a name (case-insensitive), creating the entry if needed. */
export async function getOrCreateCatalogEntry(tx: Tx, rawName: string, category?: Category) {
  const name = cleanIngredientName(rawName);
  const [existing] = await tx
    .select()
    .from(ingredientCatalog)
    .where(sql`lower(${ingredientCatalog.name}) = lower(${name})`)
    .limit(1);
  if (existing) return existing;
  const [created] = await tx
    .insert(ingredientCatalog)
    .values({ name, category: category ?? guessCategory(name) })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  // Lost a race with a concurrent insert: read it back.
  const [again] = await tx
    .select()
    .from(ingredientCatalog)
    .where(sql`lower(${ingredientCatalog.name}) = lower(${name})`)
    .limit(1);
  return again;
}
