import type { Category, Unit } from '../db/schema.js';
import { CATEGORIES } from '../db/schema.js';
import { fromBase, roundAmount, scaleAmount, toBase, unitFamily } from './units.js';

export interface IngredientLine {
  catalogId: number;
  name: string;
  category: Category;
  amount: number | null;
  unit: Unit;
  recipeTitle: string;
}

export interface CombinedItem {
  catalogId: number;
  name: string;
  category: Category;
  amount: number | null;
  unit: Unit;
  sources: string[];
}

export interface RecipeForList {
  title: string;
  servings: number;
  wantedServings: number;
  ingredients: Omit<IngredientLine, 'recipeTitle'>[];
}

/** Flattens recipes (all groups) into lines scaled to the wanted servings. */
export function scaleRecipes(list: RecipeForList[]): IngredientLine[] {
  return list.flatMap((r) =>
    r.ingredients.map((i) => ({
      ...i,
      amount: scaleAmount(i.amount, r.servings, r.wantedServings),
      recipeTitle: r.title,
    })),
  );
}

/**
 * Combines identical ingredients (same catalog entry) across recipes and groups.
 * Convertible units are normalized (g/kg, ml/l, tsp/tbsp) and summed; units that
 * can't be converted into each other (e.g. 200 g flour and 1 packet flour) stay separate items.
 */
export function combineIngredients(lines: IngredientLine[]): CombinedItem[] {
  type Acc = {
    catalogId: number;
    name: string;
    category: Category;
    unit: Unit;
    family: ReturnType<typeof unitFamily>;
    total: number | null;
    sources: Set<string>;
  };
  const groups = new Map<string, Acc>();

  for (const line of lines) {
    const family = unitFamily(line.unit);
    const key = `${line.catalogId}|${family ?? line.unit}`;
    let acc = groups.get(key);
    if (!acc) {
      acc = {
        catalogId: line.catalogId,
        name: line.name,
        category: line.category,
        unit: line.unit,
        family,
        total: null,
        sources: new Set(),
      };
      groups.set(key, acc);
    }
    acc.sources.add(line.recipeTitle);
    if (line.amount == null || line.unit === 'to taste') continue;
    const value = family ? toBase(line.amount, line.unit)!.amount : line.amount;
    acc.total = (acc.total ?? 0) + value;
  }

  const items: CombinedItem[] = [];
  for (const acc of groups.values()) {
    let amount = acc.total;
    let unit = acc.unit;
    if (acc.family && acc.total != null) {
      ({ amount, unit } = fromBase(acc.total, acc.family));
    } else if (amount != null) {
      amount = roundAmount(amount);
    }
    items.push({
      catalogId: acc.catalogId,
      name: acc.name,
      category: acc.category,
      amount,
      unit,
      sources: [...acc.sources],
    });
  }
  return sortItems(items);
}

/** Sorts by category (baking, dairy, produce, spices, other), then name. */
export function sortItems<T extends { category: Category; name: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) =>
      CATEGORIES.indexOf(a.category) - CATEGORIES.indexOf(b.category) ||
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
}
