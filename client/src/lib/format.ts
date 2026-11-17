import type { Unit } from './types';

const FRACTIONS: [number, string][] = [
  [0.125, '⅛'],
  [0.25, '¼'],
  [1 / 3, '⅓'],
  [0.5, '½'],
  [2 / 3, '⅔'],
  [0.75, '¾'],
];

/** 0.5 -> "½", 1.25 -> "1¼", 333.33 -> "333", 2.4 -> "2.4" */
export function formatAmount(n: number | null | undefined): string {
  if (n == null) return '';
  if (n >= 100) return String(Math.round(n));
  const whole = Math.floor(n);
  const frac = n - whole;
  if (n < 10) {
    for (const [value, glyph] of FRACTIONS) {
      if (Math.abs(frac - value) < 0.02) return `${whole || ''}${glyph}`;
    }
  }
  if (frac < 0.01) return String(whole);
  if (frac > 0.99) return String(whole + 1);
  return String(Math.round(n * (n >= 10 ? 10 : 100)) / (n >= 10 ? 10 : 100));
}

type Family = 'mass' | 'volume' | 'spoon';
const FAMILY: Partial<Record<Unit, [Family, number]>> = {
  g: ['mass', 1],
  kg: ['mass', 1000],
  ml: ['volume', 1],
  l: ['volume', 1000],
  tsp: ['spoon', 1],
  tbsp: ['spoon', 3],
};

/** Scales an amount and switches to a readable unit (e.g. 1200 g -> 1.2 kg). */
export function scaleIngredient(amount: number | null, unit: Unit, factor: number): { amount: number | null; unit: Unit } {
  if (amount == null) return { amount, unit };
  const scaled = amount * factor;
  const f = FAMILY[unit];
  if (!f || factor === 1) return { amount: scaled, unit };
  const base = scaled * f[1];
  switch (f[0]) {
    case 'mass':
      return base >= 1000 ? { amount: base / 1000, unit: 'kg' } : { amount: base, unit: 'g' };
    case 'volume':
      return base >= 1000 ? { amount: base / 1000, unit: 'l' } : { amount: base, unit: 'ml' };
    case 'spoon': {
      const tbsp = base / 3;
      return tbsp >= 1 && Math.abs(tbsp * 2 - Math.round(tbsp * 2)) < 1e-6
        ? { amount: tbsp, unit: 'tbsp' }
        : { amount: base, unit: 'tsp' };
    }
  }
}

export function formatQuantity(amount: number | null, unit: string | null): string {
  if (unit === 'to taste') return 'to taste';
  const a = formatAmount(amount);
  if (!unit) return a;
  if (unit === 'piece') return a;
  if (!a) return unit === 'pinch' ? 'a pinch' : '';
  const plural =
    amount != null && amount > 1 && ['pinch', 'packet', 'bunch'].includes(unit)
      ? unit === 'pinch'
        ? 'pinches'
        : unit === 'bunch'
          ? 'bunches'
          : 'packets'
      : unit;
  return `${a} ${plural}`;
}

export function formatTime(minutes: number | null | undefined) {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
}
