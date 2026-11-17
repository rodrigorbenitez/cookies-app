import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  customType,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const UNITS = [
  'g',
  'kg',
  'ml',
  'l',
  'tsp',
  'tbsp',
  'piece',
  'pinch',
  'packet',
  'bunch',
  'to taste',
] as const;
export type Unit = (typeof UNITS)[number];

export const CATEGORIES = ['baking', 'dairy', 'produce', 'spices', 'other'] as const;
export type Category = (typeof CATEGORIES)[number];

export const unitEnum = pgEnum('unit', UNITS);
export const categoryEnum = pgEnum('category', CATEGORIES);

const tsvector = customType<{ data: string }>({
  dataType: () => 'tsvector',
});

export const ingredientCatalog = pgTable(
  'ingredient_catalog',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    category: categoryEnum('category').notNull().default('other'),
  },
  (t) => [uniqueIndex('ingredient_catalog_name_lower_idx').on(sql`lower(${t.name})`)],
);

export const recipes = pgTable(
  'recipes',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    imagePath: text('image_path'),
    tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
    rating: integer('rating'),
    servings: integer('servings').notNull().default(4),
    prepTime: integer('prep_time'), // minutes
    instructions: text('instructions').notNull().default(''),
    searchVector: tsvector('search_vector'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check('recipes_rating_check', sql`${t.rating} IS NULL OR ${t.rating} BETWEEN 1 AND 5`),
    check('recipes_servings_check', sql`${t.servings} > 0`),
    index('recipes_tags_idx').using('gin', t.tags),
    index('recipes_search_idx').using('gin', t.searchVector),
  ],
);

export const ingredientGroups = pgTable(
  'ingredient_groups',
  {
    id: serial('id').primaryKey(),
    recipeId: integer('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    name: text('name').notNull().default(''),
    position: integer('position').notNull().default(0),
  },
  (t) => [index('ingredient_groups_recipe_idx').on(t.recipeId)],
);

export const ingredients = pgTable(
  'ingredients',
  {
    id: serial('id').primaryKey(),
    groupId: integer('group_id')
      .notNull()
      .references(() => ingredientGroups.id, { onDelete: 'cascade' }),
    catalogId: integer('catalog_id')
      .notNull()
      .references(() => ingredientCatalog.id, { onDelete: 'restrict' }),
    amount: doublePrecision('amount'),
    unit: unitEnum('unit').notNull().default('piece'),
    note: text('note'),
    position: integer('position').notNull().default(0),
  },
  (t) => [index('ingredients_group_idx').on(t.groupId), index('ingredients_catalog_idx').on(t.catalogId)],
);

/** One shared shopping list (personal app, no accounts). */
export const shoppingListItems = pgTable('shopping_list_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  catalogId: integer('catalog_id').references(() => ingredientCatalog.id, { onDelete: 'set null' }),
  category: categoryEnum('category').notNull().default('other'),
  amount: doublePrecision('amount'),
  unit: text('unit'),
  checked: boolean('checked').notNull().default(false),
  manual: boolean('manual').notNull().default(false),
  sources: text('sources').array().notNull().default(sql`'{}'::text[]`),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Recipes (and servings) the current generated list was built from. */
export const shoppingListRecipes = pgTable('shopping_list_recipes', {
  recipeId: integer('recipe_id')
    .primaryKey()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  servings: integer('servings').notNull(),
});
