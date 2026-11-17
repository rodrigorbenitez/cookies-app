import { Minus, Plus, Users } from 'lucide-react';

export function ServingsStepper({ value, onChange, large }: { value: number; onChange: (v: number) => void; large?: boolean }) {
  return (
    <div className={`inline-flex items-center gap-1 rounded-full bg-stone-200/60 p-1 dark:bg-white/10 ${large ? 'text-xl' : ''}`}>
      <button className="icon-btn h-9 w-9" onClick={() => onChange(Math.max(1, value - 1))} aria-label="Fewer servings">
        <Minus size={18} />
      </button>
      <span className="inline-flex min-w-24 items-center justify-center gap-1.5 font-semibold tabular-nums">
        <Users size={16} className="text-stone-500" /> {value} serving{value === 1 ? '' : 's'}
      </span>
      <button className="icon-btn h-9 w-9" onClick={() => onChange(value + 1)} aria-label="More servings">
        <Plus size={18} />
      </button>
    </div>
  );
}
