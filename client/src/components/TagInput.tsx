import { useState } from 'react';
import { X } from 'lucide-react';
import { Autocomplete } from './Autocomplete';
import { normalizeTag } from '../lib/tags';
import { useI18n } from '../lib/i18n';

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
}

/** Type tags with # (e.g. "#christmas #cookies"); space, comma or Enter adds a tag. */
export function TagInput({ value, onChange, suggestions }: Props) {
  const [text, setText] = useState('');
  const { t } = useI18n();

  const add = (raw: string) => {
    const parts = raw.split(/[\s,]+/).map(normalizeTag).filter((t) => t && /\p{L}/u.test(t));
    if (parts.length) onChange([...new Set([...value, ...parts])]);
    setText('');
  };

  const available = suggestions.filter((s) => !value.includes(s)).map((s) => `#${s}`);

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span key={tag} className="chip">
              #{tag}
              <button
                type="button"
                aria-label={t.form.removeTag(tag)}
                className="-mr-1 rounded-full p-0.5 hover:bg-pine-200 dark:hover:bg-pine-500/30"
                onClick={() => onChange(value.filter((x) => x !== tag))}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      <Autocomplete
        value={text}
        onChange={(v) => (/[\s,]$/.test(v) ? add(v) : setText(v))}
        onSelect={(v) => add(v)}
        options={available}
        placeholder={t.form.tagPlaceholder}
        enterKeyHint="done"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            add(text);
          } else if (e.key === 'Backspace' && !text && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlurCapture={() => text && add(text)}
      />
    </div>
  );
}
