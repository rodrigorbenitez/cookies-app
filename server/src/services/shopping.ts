import { asc, eq, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import {
  CATEGORIES,
  ingredientCatalog,
  ingredientGroups,
  ingredients,
  recipes,
  shoppingListItems,
  shoppingListRecipes,
} from '../db/schema.js';
import { combineIngredients, scaleRecipes, sortItems, type RecipeForList } from '../lib/shopping.js';
import { guessCategory } from '../lib/categories.js';

export const generateInput = z.object({
  recipes: z
    .array(z.object({ id: z.number().int().positive(), servings: z.number().int().min(1).max(500) }))
    .min(1)
    .max(100),
});

export const manualItemInput = z.object({
  name: z.string().trim().min(1).max(120),
  amount: z.number().positive().finite().nullable().optional(),
  unit: z.string().trim().max(20).nullable().optional(),
  category: z.enum(CATEGORIES).optional(),
});

export const itemPatchInput = z.object({
  checked: z.boolean().optional(),
  name: z.string().trim().min(1).max(120).optional(),
  amount: z.number().positive().finite().nullable().optional(),
  unit: z.string().trim().max(20).nullable().optional(),
  category: z.enum(CATEGORIES).optional(),
});

export async function getShoppingList() {
  const items = await db.select().from(shoppingListItems).orderBy(asc(shoppingListItems.id));
  const selected = await db
    .select({
      recipeId: shoppingListRecipes.recipeId,
      servings: shoppingListRecipes.servings,
      title: recipes.title,
      baseServings: recipes.servings,
      imagePath: recipes.imagePath,
    })
    .from(shoppingListRecipes)
    .innerJoin(recipes, eq(recipes.id, shoppingListRecipes.recipeId))
    .orderBy(asc(recipes.title));
  return { items: sortItems(items), recipes: selected };
}

/**
 * Rebuilds the generated part of the list from the selected recipes and servings.
 * Manually added items stay. Items that were already checked stay checked.
 */
export async function generateShoppingList(input: z.infer<typeof generateInput>) {
  const ids = [...new Set(input.recipes.map((r) => r.id))];
  const wanted = new Map(input.recipes.map((r) => [r.id, r.servings]));

  await db.transaction(async (tx) => {
    const recipeRows = await tx
      .select({ id: recipes.id, title: recipes.title, servings: recipes.servings })
      .from(recipes)
      .where(inArray(recipes.id, ids));
    const ingredientRows = await tx
      .select({
        recipeId: ingredientGroups.recipeId,
        catalogId: ingredientCatalog.id,
        name: ingredientCatalog.name,
        category: ingredientCatalog.category,
        amount: ingredients.amount,
        unit: ingredients.unit,
      })
      .from(ingredients)
      .innerJoin(ingredientGroups, eq(ingredientGroups.id, ingredients.groupId))
      .innerJoin(ingredientCatalog, eq(ingredientCatalog.id, ingredients.catalogId))
      .where(inArray(ingredientGroups.recipeId, ids));

    const forList: RecipeForList[] = recipeRows.map((r) => ({
      title: r.title,
      servings: r.servings,
      wantedServings: wanted.get(r.id) ?? r.servings,
      ingredients: ingredientRows
        .filter((i) => i.recipeId === r.id)
        .map(({ recipeId: _r, ...i }) => i),
    }));
    const combined = combineIngredients(scaleRecipes(forList));

    const previous = await tx
      .select({ catalogId: shoppingListItems.catalogId, unit: shoppingListItems.unit, checked: shoppingListItems.checked })
      .from(shoppingListItems)
      .where(eq(shoppingListItems.manual, false));
    const wasChecked = new Set(previous.filter((p) => p.checked).map((p) => `${p.catalogId}|${p.unit}`));

    await tx.delete(shoppingListItems).where(eq(shoppingListItems.manual, false));
    await tx.delete(shoppingListRecipes);
    if (combined.length) {
      await tx.insert(shoppingListItems).values(
        combined.map((item, position) => ({
          name: item.name,
          catalogId: item.catalogId,
          category: item.category,
          amount: item.amount,
          unit: item.unit,
          sources: item.sources,
          checked: wasChecked.has(`${item.catalogId}|${item.unit}`),
          manual: false,
          position,
        })),
      );
    }
    if (recipeRows.length) {
      await tx
        .insert(shoppingListRecipes)
        .values(recipeRows.map((r) => ({ recipeId: r.id, servings: wanted.get(r.id) ?? r.servings })));
    }
  });
  return getShoppingList();
}

export async function addManualItem(input: z.infer<typeof manualItemInput>) {
  const [catalog] = await db
    .select()
    .from(ingredientCatalog)
    .where(sql`lower(${ingredientCatalog.name}) = lower(${input.name})`)
    .limit(1);
  const unit = input.unit || null;
  const [item] = await db
    .insert(shoppingListItems)
    .values({
      name: catalog?.name ?? input.name,
      catalogId: catalog?.id ?? null,
      category: input.category ?? catalog?.category ?? guessCategory(input.name),
      amount: input.amount ?? null,
      unit,
      manual: true,
    })
    .returning();
  return item;
}

export async function updateItem(id: number, patch: z.infer<typeof itemPatchInput>) {
  const [item] = await db.update(shoppingListItems).set(patch).where(eq(shoppingListItems.id, id)).returning();
  return item ?? null;
}

export async function deleteItem(id: number) {
  const [item] = await db.delete(shoppingListItems).where(eq(shoppingListItems.id, id)).returning();
  return item ?? null;
}

export async function clearChecked() {
  await db.delete(shoppingListItems).where(eq(shoppingListItems.checked, true));
  return getShoppingList();
}

export async function clearAll() {
  await db.transaction(async (tx) => {
    await tx.delete(shoppingListItems);
    await tx.delete(shoppingListRecipes);
  });
  return getShoppingList();
}
