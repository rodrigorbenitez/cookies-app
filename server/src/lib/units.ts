import type { Unit } from '../db/schema.js';

export type UnitFamily = 'mass' | 'volume' | 'spoon';

/** Convertible units and their factor to the family's base unit (g, ml, tsp). */
const CONVERTIBLE: Partial<Record<Unit, { family: UnitFamily; factor: number }>> = {
  g: { family: 'mass', factor: 1 },
  kg: { family: 'mass', factor: 1000 },
  ml: { family: 'volume', factor: 1 },
  l: { family: 'volume', factor: 1000 },
  tsp: { family: 'spoon', factor: 1 },
  tbsp: { family: 'spoon', factor: 3 },
};

export function unitFamily(unit: Unit): UnitFamily | null {
  return CONVERTIBLE[unit]?.family ?? null;
}

/** Converts an amount to its family's base unit. Returns null for non-convertible units. */
export function toBase(amount: number, unit: Unit): { family: UnitFamily; amount: number } | null {
  const c = CONVERTIBLE[unit];
  return c ? { family: c.family, amount: amount * c.factor } : null;
}

/** Rounds to a sensible precision for a shopping list. */
export function roundAmount(n: number): number {
  if (n >= 100) return Math.round(n);
  if (n >= 10) return Math.round(n * 10) / 10;
  return Math.round(n * 100) / 100;
}

const EPS = 1e-9;

/** Picks the most readable unit for a total in base units: 1500 g -> 1.5 kg, 6 tsp -> 2 tbsp. */
export function fromBase(amount: number, family: UnitFamily): { amount: number; unit: Unit } {
  switch (family) {
    case 'mass':
      return amount >= 1000 - EPS ? { amount: roundAmount(amount / 1000), unit: 'kg' } : { amount: roundAmount(amount), unit: 'g' };
    case 'volume':
      return amount >= 1000 - EPS ? { amount: roundAmount(amount / 1000), unit: 'l' } : { amount: roundAmount(amount), unit: 'ml' };
    case 'spoon': {
      // Use tablespoons when the total is at least 1 tbsp and a whole or half tablespoon.
      const tbsp = amount / 3;
      const isHalfStep = Math.abs(tbsp * 2 - Math.round(tbsp * 2)) < 1e-6;
      return tbsp >= 1 - EPS && isHalfStep
        ? { amount: roundAmount(tbsp), unit: 'tbsp' }
        : { amount: roundAmount(amount), unit: 'tsp' };
    }
  }
}

/** Scales an amount from a recipe's servings to the wanted servings. */
export function scaleAmount(amount: number | null, fromServings: number, toServings: number): number | null {
  if (amount == null) return null;
  if (fromServings <= 0) return amount;
  return (amount * toServings) / fromServings;
}
