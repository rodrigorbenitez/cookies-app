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
    title: 'Vanillekipferl',
    tags: ['weihnachten', 'plätzchen'],
    rating: 5,
    servings: 40,
    prepTime: 75,
    imagePath: null,
    instructions: `## Teig
1. **Mehl**, gemahlene Mandeln, Zucker, Vanillezucker und Salz mischen.
2. Die **kalte Butter** in Stücken und die Eigelbe dazugeben und rasch zu einem glatten Teig verkneten.
3. In Folie wickeln und **mindestens 30 Minuten** kühlen.

## Formen und Backen
1. Den Ofen auf **180 °C** Ober-/Unterhitze vorheizen.
2. Den Teig zu fingerdicken Rollen formen, in Stücke schneiden und kleine Kipferl formen.
3. 10–12 Minuten backen, bis die Spitzen leicht goldbraun sind.

## Wälzen
Puderzucker und Vanillezucker mischen. Die Kipferl **noch warm** darin wälzen – sie sind zerbrechlich, also vorsichtig.

Perfekt für den bunten Teller in der #adventszeit.`,
    ingredientGroups: [
      {
        name: 'Teig',
        ingredients: [
          { amount: 280, unit: 'g', name: 'Mehl' },
          { amount: 100, unit: 'g', name: 'gemahlene Mandeln' },
          { amount: 210, unit: 'g', name: 'Butter', note: 'kalt' },
          { amount: 70, unit: 'g', name: 'Zucker' },
          { amount: 1, unit: 'packet', name: 'Vanillezucker' },
          { amount: 2, unit: 'piece', name: 'Eigelb' },
          { amount: null, unit: 'pinch', name: 'Salz' },
        ],
      },
      {
        name: 'Zum Wälzen',
        ingredients: [
          { amount: 80, unit: 'g', name: 'Puderzucker' },
          { amount: 2, unit: 'packet', name: 'Vanillezucker' },
        ],
      },
    ],
  },
  {
    title: 'Glühwein',
    tags: ['weihnachten', 'getränke'],
    rating: 4,
    servings: 6,
    prepTime: 25,
    imagePath: null,
    instructions: `## Zubereitung
1. Die Orange in Scheiben schneiden. Den Wein in einen großen Topf gießen.
2. Orangenscheiben, Zimtstangen, Nelken, Sternanis und Zucker dazugeben.
3. **20 Minuten** langsam erhitzen – er darf **nicht kochen**, sonst verfliegt der Alkohol und er wird bitter.
4. Abschmecken und nach Belieben mit Zucker oder Honig nachsüßen.

Heiß in Tassen servieren. Mit einem Schuss Rum wird daraus die #party-Version.`,
    ingredientGroups: [
      {
        name: '',
        ingredients: [
          { amount: 1, unit: 'l', name: 'Rotwein', note: 'trocken' },
          { amount: 1, unit: 'piece', name: 'Orange', note: 'unbehandelt' },
          { amount: 2, unit: 'piece', name: 'Zimtstangen' },
          { amount: 6, unit: 'piece', name: 'Gewürznelken' },
          { amount: 2, unit: 'piece', name: 'Sternanis' },
          { amount: 3, unit: 'tbsp', name: 'Zucker' },
          { amount: null, unit: 'to taste', name: 'Honig' },
        ],
      },
    ],
  },
  {
    title: 'Himbeer-Käsekuchen',
    tags: ['kuchen'],
    rating: 5,
    servings: 12,
    prepTime: 90,
    imagePath: null,
    instructions: `## Boden
1. Die Kekse fein zerbröseln und mit der **geschmolzenen Butter** mischen.
2. In eine mit Backpapier ausgelegte 26-cm-Springform drücken und kühlen.

## Füllung
1. Den Ofen auf **160 °C** vorheizen.
2. Frischkäse und Zucker glatt rühren. Die Eier **einzeln** unterrühren, dann Schmand, Vanille und Zitronenschale.
3. Auf den Boden gießen und **60 Minuten** backen. Den Ofen ausschalten und den Kuchen bei leicht geöffneter Tür darin abkühlen lassen.

## Topping
1. Die Himbeeren mit dem Zucker 5 Minuten köcheln.
2. Die Speisestärke mit etwas Wasser anrühren, einrühren und andicken lassen.
3. Auf dem kalten Käsekuchen verteilen und **über Nacht** kühlen.

Ideal für den #geburtstag.`,
    ingredientGroups: [
      {
        name: 'Boden',
        ingredients: [
          { amount: 200, unit: 'g', name: 'Butterkekse' },
          { amount: 90, unit: 'g', name: 'Butter', note: 'geschmolzen' },
        ],
      },
      {
        name: 'Füllung',
        ingredients: [
          { amount: 600, unit: 'g', name: 'Frischkäse', note: 'zimmerwarm' },
          { amount: 150, unit: 'g', name: 'Zucker' },
          { amount: 3, unit: 'piece', name: 'Eier', note: 'zimmerwarm' },
          { amount: 200, unit: 'g', name: 'Schmand' },
          { amount: 1, unit: 'tsp', name: 'Vanilleextrakt' },
          { amount: 1, unit: 'piece', name: 'Zitrone', note: 'nur die Schale' },
        ],
      },
      {
        name: 'Topping',
        ingredients: [
          { amount: 300, unit: 'g', name: 'Himbeeren', note: 'frisch oder TK' },
          { amount: 2, unit: 'tbsp', name: 'Zucker' },
          { amount: 1, unit: 'tbsp', name: 'Speisestärke' },
        ],
      },
    ],
  },
  {
    title: 'Schoko-Cookies',
    tags: ['plätzchen'],
    rating: 4,
    servings: 24,
    prepTime: 35,
    imagePath: null,
    instructions: `## Zubereitung
1. Den Ofen auf **180 °C** vorheizen und zwei Bleche mit Backpapier belegen.
2. Die **weiche Butter** mit beiden Zuckersorten cremig schlagen. Eier und Vanille unterrühren.
3. Mehl, Natron und Salz mischen und unter die Buttermasse rühren.
4. Die Schokotropfen unterheben.
5. Mit Abstand kleine Kugeln auf die Bleche setzen.
6. **10–12 Minuten** backen – die Mitte sollte noch weich aussehen.

5 Minuten auf dem Blech ruhen lassen. #einfach`,
    ingredientGroups: [
      {
        name: 'Teig',
        ingredients: [
          { amount: 225, unit: 'g', name: 'Butter', note: 'weich' },
          { amount: 200, unit: 'g', name: 'brauner Zucker' },
          { amount: 100, unit: 'g', name: 'Zucker' },
          { amount: 2, unit: 'piece', name: 'Eier' },
          { amount: 2, unit: 'tsp', name: 'Vanilleextrakt' },
          { amount: 375, unit: 'g', name: 'Mehl' },
          { amount: 1, unit: 'tsp', name: 'Natron' },
          { amount: 1, unit: 'tsp', name: 'Salz' },
          { amount: 300, unit: 'g', name: 'Schokotropfen' },
        ],
      },
    ],
  },
  {
    title: 'Zitronenkuchen',
    tags: ['kuchen'],
    rating: 4,
    servings: 10,
    prepTime: 60,
    imagePath: null,
    instructions: `## Kuchen
1. Den Ofen auf **180 °C** vorheizen und eine Kastenform auslegen.
2. Butter und Zucker hell aufschlagen, dann die Eier einzeln unterrühren.
3. Mehl, Backpulver und Zitronenschale unterheben.
4. **45 Minuten** backen, bis an einem Holzstäbchen nichts mehr kleben bleibt.

## Guss
Zitronensaft mit Puderzucker verrühren. Den **warmen** Kuchen rundherum mit einem Stäbchen einstechen und den Guss darübergießen. #einfach`,
    ingredientGroups: [
      {
        name: 'Teig',
        ingredients: [
          { amount: 225, unit: 'g', name: 'Butter', note: 'weich' },
          { amount: 225, unit: 'g', name: 'Zucker' },
          { amount: 4, unit: 'piece', name: 'Eier' },
          { amount: 225, unit: 'g', name: 'Mehl' },
          { amount: 2, unit: 'tsp', name: 'Backpulver' },
          { amount: 1, unit: 'piece', name: 'Zitrone', note: 'nur die Schale' },
        ],
      },
      {
        name: 'Guss',
        ingredients: [
          { amount: 1.5, unit: 'piece', name: 'Zitrone', note: 'Saft' },
          { amount: 85, unit: 'g', name: 'Puderzucker' },
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
