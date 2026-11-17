import { Star } from 'lucide-react';
import { useI18n } from '../lib/i18n';

interface Props {
  value: number | null;
  onChange?: (value: number | null) => void;
  size?: number;
  className?: string;
}

/** Shows 1–5 stars. When `onChange` is set, stars are tappable; tapping the current value clears it. */
export function StarRating({ value, onChange, size = 18, className = '' }: Props) {
  const v = value ?? 0;
  const { t } = useI18n();
  return (
    <div
      className={`inline-flex items-center ${onChange ? 'gap-0.5' : 'gap-px'} ${className}`}
      role={onChange ? 'radiogroup' : 'img'}
      aria-label={value ? t.stars.value(value) : t.stars.notRated}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= v;
        const star = (
          <Star
            size={size}
            strokeWidth={1.75}
            className={filled ? 'fill-gold-400 text-gold-500' : 'text-stone-300 dark:text-stone-600'}
          />
        );
        return onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === v}
            aria-label={t.stars.option(n)}
            className="rounded-full p-1 transition hover:scale-110 active:scale-95"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange(n === v ? null : n);
            }}
          >
            {star}
          </button>
        ) : (
          <span key={n}>{star}</span>
        );
      })}
    </div>
  );
}
