import type { Category } from '../db/schema.js';

/** Keywords (English and German) matched as substrings of the lowercased ingredient name. */
const KEYWORDS: Record<Exclude<Category, 'other'>, string[]> = {
  baking: [
    'flour', 'sugar', 'baking powder', 'baking soda', 'yeast', 'starch', 'cornstarch', 'cocoa',
    'chocolate', 'vanilla', 'almond', 'hazelnut', 'walnut', 'pecan', 'nut', 'oat', 'gelatin',
    'honey', 'syrup', 'marzipan', 'sprinkles', 'biscuit', 'cracker', 'raisin', 'icing', 'semolina',
    'mehl', 'zucker', 'backpulver', 'natron', 'hefe', 'stärke', 'kakao', 'schoko', 'kuvertüre',
    'vanille', 'mandel', 'haselnuss', 'walnuss', 'nüsse', 'nuss', 'hafer', 'gelatine', 'honig',
    'sirup', 'streusel', 'keks', 'rosinen', 'grieß', 'zuckerguss', 'oblaten', 'orangeat', 'zitronat',
  ],
  dairy: [
    'milk', 'butter', 'cream', 'cheese', 'quark', 'yogurt', 'yoghurt', 'mascarpone', 'ricotta',
    'egg', 'buttermilk', 'creme fraiche', 'crème fraîche', 'sour cream', 'mozzarella', 'parmesan',
    'milch', 'sahne', 'käse', 'joghurt', 'eier', 'eigelb', 'eiweiß', 'schmand',
  ],
  produce: [
    'apple', 'banana', 'lemon', 'lime', 'orange', 'berry', 'berries', 'strawberr', 'raspberr',
    'blueberr', 'cherry', 'cherries', 'pear', 'peach', 'plum', 'apricot', 'grape', 'mango',
    'pineapple', 'carrot', 'potato', 'onion', 'garlic', 'tomato', 'pumpkin', 'zucchini', 'herb',
    'mint', 'basil', 'parsley', 'rhubarb', 'ginger root', 'fresh',
    'apfel', 'äpfel', 'banane', 'zitrone', 'limette', 'beere', 'kirsch', 'birne', 'pfirsich',
    'pflaume', 'aprikose', 'traube', 'ananas', 'karotte', 'möhre', 'kartoffel', 'zwiebel',
    'knoblauch', 'tomate', 'kürbis', 'kräuter', 'minze', 'basilikum', 'petersilie', 'rhabarber',
  ],
  spices: [
    'salt', 'pepper', 'cinnamon', 'clove', 'nutmeg', 'cardamom', 'anise', 'star anise', 'ginger',
    'allspice', 'paprika', 'cumin', 'saffron', 'spice', 'mace',
    'salz', 'pfeffer', 'zimt', 'nelke', 'muskat', 'kardamom', 'anis', 'ingwer', 'piment',
    'kreuzkümmel', 'safran', 'gewürz',
  ],
};

/** Whole words that are too short to match as substrings ("ei" would match "Weizenmehl"). */
const WORDS: Partial<Record<Category, string[]>> = {
  dairy: ['ei'],
};

/** Checked first, for names where the generic keywords pick the wrong category. */
const OVERRIDES: [string, Category][] = [
  ['butterkeks', 'baking'],
  ['butter biscuit', 'baking'],
  ['muskatnuss', 'spices'],
  ['orangeat', 'baking'],
  ['zitronat', 'baking'],
  ['peanut butter', 'other'],
];

/** Best-effort category for a new catalog ingredient. It can be changed later in Settings. */
export function guessCategory(name: string): Category {
  const n = name.toLowerCase();
  for (const [key, cat] of OVERRIDES) if (n.includes(key)) return cat;
  const words = n.split(/[^\p{L}]+/u);
  // Dairy and produce first so "butter" isn't baking and "lemon zest" is produce;
  // spices before baking so "nutmeg" isn't caught by "nut".
  for (const cat of ['dairy', 'produce', 'spices', 'baking'] as const) {
    if (KEYWORDS[cat].some((k) => n.includes(k))) return cat;
    if (WORDS[cat]?.some((w) => words.includes(w))) return cat;
  }
  return 'other';
}
