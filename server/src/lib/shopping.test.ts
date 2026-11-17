import { describe, expect, it } from 'vitest';
import { combineIngredients, scaleRecipes, type IngredientLine } from './shopping.js';
import { fromBase, scaleAmount, toBase } from './units.js';

const line = (p: Partial<IngredientLine> & Pick<IngredientLine, 'amount' | 'unit'>): IngredientLine => ({
  catalogId: 1,
  name: 'flour',
  category: 'baking',
  recipeTitle: 'Cookies',
  ...p,
});

describe('unit conversion', () => {
  it('converts to base units', () => {
    expect(toBase(1.5, 'kg')).toEqual({ family: 'mass', amount: 1500 });
    expect(toBase(250, 'g')).toEqual({ family: 'mass', amount: 250 });
    expect(toBase(0.5, 'l')).toEqual({ family: 'volume', amount: 500 });
    expect(toBase(2, 'tbsp')).toEqual({ family: 'spoon', amount: 6 });
    expect(toBase(1, 'tsp')).toEqual({ family: 'spoon', amount: 1 });
  });

  it('returns null for units that cannot be converted', () => {
    for (const unit of ['piece', 'pinch', 'packet', 'bunch', 'to taste'] as const) {
      expect(toBase(1, unit)).toBeNull();
    }
  });

  it('picks a readable unit', () => {
    expect(fromBase(999, 'mass')).toEqual({ amount: 999, unit: 'g' });
    expect(fromBase(1000, 'mass')).toEqual({ amount: 1, unit: 'kg' });
    expect(fromBase(1250, 'mass')).toEqual({ amount: 1.25, unit: 'kg' });
    expect(fromBase(750, 'volume')).toEqual({ amount: 750, unit: 'ml' });
    expect(fromBase(1500, 'volume')).toEqual({ amount: 1.5, unit: 'l' });
    expect(fromBase(6, 'spoon')).toEqual({ amount: 2, unit: 'tbsp' });
    expect(fromBase(4.5, 'spoon')).toEqual({ amount: 1.5, unit: 'tbsp' });
    expect(fromBase(4, 'spoon')).toEqual({ amount: 4, unit: 'tsp' });
    expect(fromBase(2, 'spoon')).toEqual({ amount: 2, unit: 'tsp' });
  });

  it('scales amounts by servings', () => {
    expect(scaleAmount(200, 4, 8)).toBe(400);
    expect(scaleAmount(3, 12, 4)).toBe(1);
    expect(scaleAmount(null, 4, 8)).toBeNull();
  });
});

describe('combineIngredients', () => {
  it('sums g and kg into kg when the total reaches 1 kg', () => {
    const items = combineIngredients([
      line({ amount: 500, unit: 'g' }),
      line({ amount: 0.75, unit: 'kg', recipeTitle: 'Bread' }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ amount: 1.25, unit: 'kg', sources: ['Cookies', 'Bread'] });
  });

  it('sums ml and l', () => {
    const items = combineIngredients([
      line({ catalogId: 2, name: 'milk', category: 'dairy', amount: 250, unit: 'ml' }),
      line({ catalogId: 2, name: 'milk', category: 'dairy', amount: 0.5, unit: 'l' }),
    ]);
    expect(items).toEqual([
      expect.objectContaining({ name: 'milk', amount: 750, unit: 'ml' }),
    ]);
  });

  it('sums tsp and tbsp', () => {
    const items = combineIngredients([
      line({ catalogId: 3, name: 'cinnamon', category: 'spices', amount: 1, unit: 'tbsp' }),
      line({ catalogId: 3, name: 'cinnamon', category: 'spices', amount: 3, unit: 'tsp' }),
    ]);
    expect(items[0]).toMatchObject({ amount: 2, unit: 'tbsp' });
  });

  it('keeps tsp when the total is not a whole or half tablespoon', () => {
    const items = combineIngredients([
      line({ catalogId: 3, name: 'cinnamon', category: 'spices', amount: 1, unit: 'tbsp' }),
      line({ catalogId: 3, name: 'cinnamon', category: 'spices', amount: 1, unit: 'tsp' }),
    ]);
    expect(items[0]).toMatchObject({ amount: 4, unit: 'tsp' });
  });

  it('lists units that cannot be converted separately', () => {
    const items = combineIngredients([
      line({ amount: 200, unit: 'g' }),
      line({ amount: 1, unit: 'packet' }),
      line({ amount: 2, unit: 'packet' }),
    ]);
    expect(items).toHaveLength(2);
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ amount: 200, unit: 'g' }),
        expect.objectContaining({ amount: 3, unit: 'packet' }),
      ]),
    );
  });

  it('does not mix mass, volume and spoons of the same ingredient', () => {
    const items = combineIngredients([
      line({ amount: 100, unit: 'g' }),
      line({ amount: 100, unit: 'ml' }),
      line({ amount: 1, unit: 'tbsp' }),
    ]);
    expect(items.map((i) => i.unit).sort()).toEqual(['g', 'ml', 'tbsp']);
  });

  it('keeps different ingredients apart', () => {
    const items = combineIngredients([
      line({ amount: 100, unit: 'g' }),
      line({ catalogId: 2, name: 'sugar', amount: 100, unit: 'g' }),
    ]);
    expect(items).toHaveLength(2);
  });

  it('handles missing amounts and "to taste"', () => {
    const items = combineIngredients([
      line({ catalogId: 4, name: 'salt', category: 'spices', amount: null, unit: 'to taste' }),
      line({ catalogId: 4, name: 'salt', category: 'spices', amount: null, unit: 'to taste', recipeTitle: 'Bread' }),
      line({ catalogId: 5, name: 'eggs', category: 'dairy', amount: null, unit: 'piece' }),
      line({ catalogId: 5, name: 'eggs', category: 'dairy', amount: 2, unit: 'piece' }),
    ]);
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'salt', amount: null, unit: 'to taste', sources: ['Cookies', 'Bread'] }),
        expect.objectContaining({ name: 'eggs', amount: 2, unit: 'piece' }),
      ]),
    );
    expect(items).toHaveLength(2);
  });

  it('rounds awkward totals', () => {
    const items = combineIngredients([line({ amount: 1000 / 3, unit: 'g' })]);
    expect(items[0]).toMatchObject({ amount: 333, unit: 'g' });
  });

  it('sorts by category then name', () => {
    const items = combineIngredients([
      line({ catalogId: 9, name: 'Zucchini', category: 'produce', amount: 1, unit: 'piece' }),
      line({ catalogId: 8, name: 'salt', category: 'spices', amount: null, unit: 'pinch' }),
      line({ catalogId: 7, name: 'butter', category: 'dairy', amount: 100, unit: 'g' }),
      line({ catalogId: 6, name: 'apple', category: 'produce', amount: 2, unit: 'piece' }),
      line({ catalogId: 1, name: 'sugar', category: 'baking', amount: 50, unit: 'g' }),
    ]);
    expect(items.map((i) => i.name)).toEqual(['sugar', 'butter', 'apple', 'Zucchini', 'salt']);
  });
});

describe('scaleRecipes', () => {
  it('scales every group of every recipe before combining', () => {
    const lines = scaleRecipes([
      {
        title: 'Cheesecake',
        servings: 8,
        wantedServings: 16,
        ingredients: [
          { catalogId: 1, name: 'flour', category: 'baking', amount: 200, unit: 'g' },
          { catalogId: 1, name: 'flour', category: 'baking', amount: 50, unit: 'g' },
        ],
      },
      {
        title: 'Cookies',
        servings: 20,
        wantedServings: 10,
        ingredients: [{ catalogId: 1, name: 'flour', category: 'baking', amount: 1, unit: 'kg' }],
      },
    ]);
    const items = combineIngredients(lines);
    // (200 + 50) * 2 = 500 g, plus 1 kg / 2 = 500 g -> 1 kg
    expect(items).toEqual([expect.objectContaining({ amount: 1, unit: 'kg', sources: ['Cheesecake', 'Cookies'] })]);
  });
});
