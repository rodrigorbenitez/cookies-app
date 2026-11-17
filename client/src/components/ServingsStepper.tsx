import { Minus, Plus, Users } from 'lucide-react';
import { useI18n } from '../lib/i18n';

export function ServingsStepper({ value, onChange, large }: { value: number; onChange: (v: number) => void; large?: boolean }) {
  const { t } = useI18n();
  return (
    <div className={`inline-flex items-center gap-1 rounded-full bg-stone-200/60 p-1 dark:bg-white/10 ${large ? 'text-xl' : ''}`}>
      <button className="icon-btn h-9 w-9" onClick={() => onChange(Math.max(1, value - 1))} aria-label={t.servings.fewer}>
        <Minus size={18} />
      </button>
      <span className="inline-flex min-w-24 items-center justify-center gap-1.5 font-semibold tabular-nums">
        <Users size={16} className="text-stone-500" /> {t.servings.count(value)}
      </span>
      <button className="icon-btn h-9 w-9" onClick={() => onChange(value + 1)} aria-label={t.servings.more}>
        <Plus size={18} />
      </button>
    </div>
  );
}
