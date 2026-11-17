import type { Category } from '../db/schema.js';

const KEYWORDS: Record<Exclude<Category, 'other'>, string[]> = {
  baking: [
    'flour', 'sugar', 'baking powder', 'baking soda', 'yeast', 'starch', 'cornstarch', 'cocoa',
    'chocolate', 'vanilla', 'almond', 'hazelnut', 'walnut', 'pecan', 'nut', 'oat', 'gelatin',
    'honey', 'syrup', 'marzipan', 'sprinkles', 'biscuit', 'cracker', 'raisin', 'icing', 'semolina',
  ],
  dairy: [
    'milk', 'butter', 'cream', 'cheese', 'quark', 'yogurt', 'yoghurt', 'mascarpone', 'ricotta',
    'egg', 'buttermilk', 'creme fraiche', 'crème fraîche', 'sour cream', 'mozzarella', 'parmesan',
  ],
  produce: [
    'apple', 'banana', 'lemon', 'lime', 'orange', 'berry', 'berries', 'strawberr', 'raspberr',
    'blueberr', 'cherry', 'cherries', 'pear', 'peach', 'plum', 'apricot', 'grape', 'mango',
    'pineapple', 'carrot', 'potato', 'onion', 'garlic', 'tomato', 'pumpkin', 'zucchini', 'herb',
    'mint', 'basil', 'parsley', 'rhubarb', 'ginger root', 'fresh',
  ],
  spices: [
    'salt', 'pepper', 'cinnamon', 'clove', 'nutmeg', 'cardamom', 'anise', 'star anise', 'ginger',
    'allspice', 'paprika', 'cumin', 'saffron', 'spice', 'mace',
  ],
};

/** Best-effort category for a new catalog ingredient. It can be changed later in Settings. */
export function guessCategory(name: string): Category {
  const n = name.toLowerCase();
  // Check dairy/produce first so "butter" is not "baking" and "lemon zest" is produce.
  for (const cat of ['dairy', 'produce', 'baking', 'spices'] as const) {
    if (KEYWORDS[cat].some((k) => n.includes(k))) return cat;
  }
  return 'other';
}
