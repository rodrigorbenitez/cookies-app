import { useId, useMemo, useState, type InputHTMLAttributes, type ReactNode } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'onSelect'> {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  onSelect?: (value: string) => void;
  renderOption?: (option: string) => ReactNode;
  maxOptions?: number;
}

/** A text input with a suggestion dropdown (works the same on touch and desktop). */
export function Autocomplete({
  value,
  onChange,
  options,
  onSelect,
  renderOption,
  maxOptions = 8,
  className = '',
  onKeyDown,
  ...rest
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    const starts = options.filter((o) => o.toLowerCase().startsWith(q));
    const contains = options.filter((o) => !o.toLowerCase().startsWith(q) && o.toLowerCase().includes(q));
    return [...starts, ...contains].filter((o) => o.toLowerCase() !== q).slice(0, maxOptions);
  }, [value, options, maxOptions]);

  const pick = (o: string) => {
    onChange(o);
    onSelect?.(o);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        {...rest}
        className={`input ${className}`}
        value={value}
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (open && matches.length) {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => (a + 1) % matches.length);
              return;
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => (a - 1 + matches.length) % matches.length);
              return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
              if (e.key === 'Enter') e.preventDefault();
              pick(matches[active]);
              return;
            }
            if (e.key === 'Escape') {
              setOpen(false);
              return;
            }
          }
          onKeyDown?.(e);
        }}
      />
      {open && matches.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full min-w-48 overflow-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-stone-900/10 dark:bg-night-800 dark:ring-white/10"
        >
          {matches.map((o, i) => (
            <li
              key={o}
              role="option"
              aria-selected={i === active}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === active ? 'bg-brand-100 dark:bg-brand-500/20' : ''
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(o);
              }}
            >
              {renderOption ? renderOption(o) : o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
