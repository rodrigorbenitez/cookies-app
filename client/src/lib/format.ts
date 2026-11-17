import type { Lang } from './i18n';
import type { Unit } from './types';

const FRACTIONS: [number, string][] = [
  [0.125, '⅛'],
  [0.25, '¼'],
  [1 / 3, '⅓'],
  [0.5, '½'],
  [2 / 3, '⅔'],
  [0.75, '¾'],
];

/** 0.5 -> "½", 1.25 -> "1¼", 333.33 -> "333", 2.4 -> "2.4" (en) / "2,4" (de) */
export function formatAmount(n: number | null | undefined, lang: Lang = 'de'): string {
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
  const digits = n >= 10 ? 10 : 100;
  const s = String(Math.round(n * digits) / digits);
  return lang === 'de' ? s.replace('.', ',') : s;
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

/** Unit names as shown in the unit picker. */
const UNIT_NAMES: Record<Lang, Record<Unit, string>> = {
  en: {
    g: 'g', kg: 'kg', ml: 'ml', l: 'l', tsp: 'tsp', tbsp: 'tbsp',
    piece: 'piece', pinch: 'pinch', packet: 'packet', bunch: 'bunch', 'to taste': 'to taste',
  },
  de: {
    g: 'g', kg: 'kg', ml: 'ml', l: 'l', tsp: 'TL', tbsp: 'EL',
    piece: 'Stück', pinch: 'Prise', packet: 'Päckchen', bunch: 'Bund', 'to taste': 'nach Geschmack',
  },
};

const UNIT_PLURALS: Record<Lang, Partial<Record<Unit, string>>> = {
  en: { pinch: 'pinches', packet: 'packets', bunch: 'bunches' },
  de: { pinch: 'Prisen' },
};

export function unitName(unit: Unit, lang: Lang) {
  return UNIT_NAMES[lang][unit] ?? unit;
}

function isUnit(u: string): u is Unit {
  return u in UNIT_NAMES.en;
}

/** "250 g", "2 EL", "eine Prise", "nach Geschmack". Pieces show only the number. */
export function formatQuantity(amount: number | null, unit: string | null, lang: Lang = 'de'): string {
  if (unit === 'to taste') return UNIT_NAMES[lang]['to taste'];
  const a = formatAmount(amount, lang);
  if (!unit || unit === 'piece') return a;
  if (!isUnit(unit)) return a ? `${a} ${unit}` : unit;
  if (!a) return unit === 'pinch' ? (lang === 'de' ? 'eine Prise' : 'a pinch') : '';
  const name = amount != null && amount > 1 ? (UNIT_PLURALS[lang][unit] ?? unitName(unit, lang)) : unitName(unit, lang);
  return `${a} ${name}`;
}

export function formatTime(minutes: number | null | undefined, lang: Lang = 'de') {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const [hu, mu] = lang === 'de' ? ['Std.', 'Min.'] : ['h', 'min'];
  return h ? `${h} ${hu}${m ? ` ${m} ${mu}` : ''}` : `${m} ${mu}`;
}

/** Unit words a user may type in the shopping list ("2 EL Zucker", "1 Pck. Vanillezucker"). */
const UNIT_ALIASES: Record<string, Unit> = {
  g: 'g', gr: 'g', gramm: 'g', kg: 'kg', ml: 'ml', l: 'l', liter: 'l',
  tsp: 'tsp', tl: 'tsp', tbsp: 'tbsp', el: 'tbsp',
  piece: 'piece', pieces: 'piece', stk: 'piece', stück: 'piece',
  pinch: 'pinch', prise: 'pinch', prisen: 'pinch',
  packet: 'packet', packets: 'packet', pck: 'packet', päckchen: 'packet', pkg: 'packet',
  bunch: 'bunch', bund: 'bunch',
};

export function parseUnitWord(word: string): Unit | null {
  return UNIT_ALIASES[word.toLowerCase().replace(/\.$/, '')] ?? null;
}
