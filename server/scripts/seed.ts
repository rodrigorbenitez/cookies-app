/**
 * Adds 5 sample recipes. Safe to run more than once: recipes whose title already exists are skipped.
 * Usage: npm run seed  (reads DATABASE_URL from the environment / local .env)
 */
import { sql } from 'drizzle-orm';
import { db, sqlClient } from '../src/db/client.js';
import { runMigrations } from '../src/db/migrate.js';
import { recipes } from '../src/db/schema.js';
import { createRecipe, type RecipeInput } from '../src/services/recipes.js';

const samples: RecipeInput[] = [
  {
    title: 'Vanilla Crescent Cookies',
    tags: ['christmas', 'cookies'],
    rating: 5,
    servings: 40,
    prepTime: 75,
    imagePath: null,
    instructions: `## Dough
1. Mix **flour**, ground almonds, sugar, vanilla sugar and salt.
2. Add the **cold butter** in cubes and the egg yolks, then knead quickly into a smooth dough.
3. Wrap and chill for **at least 30 minutes**.

## Shaping and baking
1. Preheat the oven to **180 °C** (top/bottom heat).
2. Roll the dough into finger-thick logs, cut into pieces and shape small crescents.
3. Bake for 10–12 minutes until the tips are just golden.

## Coating
Mix powdered sugar and vanilla sugar. Roll the crescents in it **while still warm** – they are fragile, so be gentle.

Perfect for the #advent cookie plate.`,
    ingredientGroups: [
      {
        name: 'Dough',
        ingredients: [
          { amount: 280, unit: 'g', name: 'flour' },
          { amount: 100, unit: 'g', name: 'ground almonds' },
          { amount: 210, unit: 'g', name: 'butter', note: 'cold' },
          { amount: 70, unit: 'g', name: 'sugar' },
          { amount: 1, unit: 'packet', name: 'vanilla sugar' },
          { amount: 2, unit: 'piece', name: 'egg yolk' },
          { amount: null, unit: 'pinch', name: 'salt' },
        ],
      },
      {
        name: 'Coating',
        ingredients: [
          { amount: 80, unit: 'g', name: 'powdered sugar' },
          { amount: 2, unit: 'packet', name: 'vanilla sugar' },
        ],
      },
    ],
  },
  {
    title: 'Mulled Wine',
    tags: ['christmas', 'drinks'],
    rating: 4,
    servings: 6,
    prepTime: 25,
    imagePath: null,
    instructions: `## Preparation
1. Slice the orange. Pour the wine into a large pot.
2. Add orange slices, cinnamon sticks, cloves, star anise and sugar.
3. Heat slowly for **20 minutes** – it must **not boil**, or the alcohol evaporates and it turns bitter.
4. Taste and add more sugar or honey if you like.

Serve hot in mugs. A splash of rum makes it a #party version.`,
    ingredientGroups: [
      {
        name: '',
        ingredients: [
          { amount: 1, unit: 'l', name: 'red wine', note: 'dry' },
          { amount: 1, unit: 'piece', name: 'orange', note: 'organic' },
          { amount: 2, unit: 'piece', name: 'cinnamon stick' },
          { amount: 6, unit: 'piece', name: 'cloves' },
          { amount: 2, unit: 'piece', name: 'star anise' },
          { amount: 3, unit: 'tbsp', name: 'sugar' },
          { amount: null, unit: 'to taste', name: 'honey' },
        ],
      },
    ],
  },
  {
    title: 'Raspberry Cheesecake',
    tags: ['cake'],
    rating: 5,
    servings: 12,
    prepTime: 90,
    imagePath: null,
    instructions: `## Base
1. Crush the biscuits finely and mix with the **melted butter**.
2. Press into a lined 26 cm springform pan and chill.

## Filling
1. Preheat the oven to **160 °C**.
2. Beat cream cheese and sugar until smooth. Add the eggs **one at a time**, then sour cream, vanilla and lemon zest.
3. Pour onto the base and bake for **60 minutes**. Turn off the oven and let it cool inside with the door ajar.

## Topping
1. Simmer the raspberries with sugar for 5 minutes.
2. Stir in the cornstarch mixed with a little water and cook until thick.
3. Spread over the cold cheesecake and chill **overnight**.

Great for #birthday parties.`,
    ingredientGroups: [
      {
        name: 'Base',
        ingredients: [
          { amount: 200, unit: 'g', name: 'digestive biscuits' },
          { amount: 90, unit: 'g', name: 'butter', note: 'melted' },
        ],
      },
      {
        name: 'Filling',
        ingredients: [
          { amount: 600, unit: 'g', name: 'cream cheese', note: 'room temperature' },
          { amount: 150, unit: 'g', name: 'sugar' },
          { amount: 3, unit: 'piece', name: 'eggs', note: 'room temperature' },
          { amount: 200, unit: 'g', name: 'sour cream' },
          { amount: 1, unit: 'tsp', name: 'vanilla extract' },
          { amount: 1, unit: 'piece', name: 'lemon', note: 'zest only' },
        ],
      },
      {
        name: 'Topping',
        ingredients: [
          { amount: 300, unit: 'g', name: 'raspberries', note: 'fresh or frozen' },
          { amount: 2, unit: 'tbsp', name: 'sugar' },
          { amount: 1, unit: 'tbsp', name: 'cornstarch' },
        ],
      },
    ],
  },
  {
    title: 'Chocolate Chip Cookies',
    tags: ['cookies'],
    rating: 4,
    servings: 24,
    prepTime: 35,
    imagePath: null,
    instructions: `## Steps
1. Preheat the oven to **180 °C** and line two trays with baking paper.
2. Cream the **soft butter** with both sugars until fluffy. Beat in eggs and vanilla.
3. Whisk flour, baking soda and salt, then stir into the butter mixture.
4. Fold in the chocolate chips.
5. Scoop balls onto the trays, leaving space between them.
6. Bake for **10–12 minutes** – the centres should still look soft.

Let them rest on the tray for 5 minutes. #easy`,
    ingredientGroups: [
      {
        name: 'Dough',
        ingredients: [
          { amount: 225, unit: 'g', name: 'butter', note: 'soft' },
          { amount: 200, unit: 'g', name: 'brown sugar' },
          { amount: 100, unit: 'g', name: 'sugar' },
          { amount: 2, unit: 'piece', name: 'eggs' },
          { amount: 2, unit: 'tsp', name: 'vanilla extract' },
          { amount: 375, unit: 'g', name: 'flour' },
          { amount: 1, unit: 'tsp', name: 'baking soda' },
          { amount: 1, unit: 'tsp', name: 'salt' },
          { amount: 300, unit: 'g', name: 'chocolate chips' },
        ],
      },
    ],
  },
  {
    title: 'Lemon Drizzle Cake',
    tags: ['cake'],
    rating: 4,
    servings: 10,
    prepTime: 60,
    imagePath: null,
    instructions: `## Cake
1. Preheat the oven to **180 °C** and line a loaf tin.
2. Beat butter and sugar until pale, then add the eggs one by one.
3. Fold in flour, baking powder and the lemon zest.
4. Bake for **45 minutes** until a skewer comes out clean.

## Drizzle
Mix lemon juice with powdered sugar and pour over the **warm** cake after pricking it all over with a skewer. #easy`,
    ingredientGroups: [
      {
        name: 'Cake',
        ingredients: [
          { amount: 225, unit: 'g', name: 'butter', note: 'soft' },
          { amount: 225, unit: 'g', name: 'sugar' },
          { amount: 4, unit: 'piece', name: 'eggs' },
          { amount: 225, unit: 'g', name: 'flour' },
          { amount: 2, unit: 'tsp', name: 'baking powder' },
          { amount: 1, unit: 'piece', name: 'lemon', note: 'zest only' },
        ],
      },
      {
        name: 'Drizzle',
        ingredients: [
          { amount: 1.5, unit: 'piece', name: 'lemon', note: 'juice' },
          { amount: 85, unit: 'g', name: 'powdered sugar' },
        ],
      },
    ],
  },
];

async function main() {
  await runMigrations();
  const existing = new Set(
    (await db.select({ title: recipes.title }).from(recipes)).map((r) => r.title.toLowerCase()),
  );
  let added = 0;
  for (const recipe of samples) {
    if (existing.has(recipe.title.toLowerCase())) {
      console.log(`Skipped (exists): ${recipe.title}`);
      continue;
    }
    await createRecipe(recipe);
    console.log(`Added: ${recipe.title}`);
    added++;
  }
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(recipes);
  console.log(`Done. Added ${added} recipe(s); ${count} recipe(s) in total.`);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err instanceof Error ? err.message : 'unknown error');
    process.exitCode = 1;
  })
  .finally(() => sqlClient.end());
