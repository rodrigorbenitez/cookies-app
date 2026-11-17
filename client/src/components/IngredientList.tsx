import { Check } from 'lucide-react';
import type { IngredientGroup } from '../lib/types';
import { formatQuantity, scaleIngredient } from '../lib/format';
import { useI18n } from '../lib/i18n';

interface Props {
  groups: IngredientGroup[];
  factor: number;
  checked?: Set<number>;
  onToggle?: (id: number) => void;
  large?: boolean;
}

/** Ingredients by group, scaled by `factor`. Optionally checkable (cooking mode). */
export function IngredientList({ groups, factor, checked, onToggle, large }: Props) {
  const { lang } = useI18n();
  const visible = groups.filter((g) => g.ingredients.length || g.name);
  return (
    <div className={large ? 'space-y-6' : 'space-y-5'}>
      {visible.map((g) => (
        <section key={g.id}>
          {g.name && (
            <h3
              className={`mb-2 font-display font-semibold text-amber-800 dark:text-amber-300 ${large ? 'text-2xl' : 'text-lg'}`}
            >
              {g.name}
            </h3>
          )}
          <ul className={large ? 'space-y-1' : 'divide-y divide-stone-900/5 dark:divide-white/5'}>
            {g.ingredients.map((i) => {
              const s = scaleIngredient(i.amount, i.unit, factor);
              const qty = formatQuantity(s.amount, s.unit, lang);
              const done = checked?.has(i.id);
              const content = (
                <>
                  <span
                    className={`shrink-0 text-right font-semibold tabular-nums text-stone-900 dark:text-stone-50 ${
                      large ? 'w-32' : 'w-24'
                    }`}
                  >
                    {qty}
                  </span>
                  <span className="flex-1">
                    {i.name}
                    {i.note && <span className="text-stone-500 dark:text-stone-400">, {i.note}</span>}
                  </span>
                </>
              );
              return (
                <li key={i.id}>
                  {onToggle ? (
                    <button
                      type="button"
                      onClick={() => onToggle(i.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-stone-200/50 dark:hover:bg-white/5 ${
                        done ? 'opacity-40 line-through' : ''
                      } ${large ? 'text-xl md:text-2xl' : ''}`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 ${
                          done ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-stone-300 dark:border-stone-600'
                        }`}
                      >
                        {done && <Check size={18} strokeWidth={3} />}
                      </span>
                      {content}
                    </button>
                  ) : (
                    <div className="flex items-baseline gap-3 py-2">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
