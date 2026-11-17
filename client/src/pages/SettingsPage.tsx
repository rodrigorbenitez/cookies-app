import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Loader2, Monitor, Moon, Search, Sun, Trash2, Upload } from 'lucide-react';
import { api } from '../lib/api';
import { CATEGORIES, CATEGORY_LABELS, type Category } from '../lib/types';
import { applyTheme, getTheme, type Theme } from '../lib/theme';
import { useToast } from '../components/Toast';

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold">Settings</h1>
      <ThemeSection />
      <BackupSection />
      <CatalogSection />
    </div>
  );
}

function ThemeSection() {
  const [theme, setTheme] = useState<Theme>(getTheme());
  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];
  return (
    <section className="card p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">Appearance</h2>
      <div className="grid grid-cols-3 gap-2">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            className={`btn flex-col py-3 ${
              theme === value
                ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-600/40 dark:bg-amber-500/15 dark:text-amber-200'
                : 'btn-secondary'
            }`}
            onClick={() => {
              setTheme(value);
              applyTheme(value);
            }}
            aria-pressed={theme === value}
          >
            <Icon size={20} /> {label}
          </button>
        ))}
      </div>
    </section>
  );
}

function BackupSection() {
  const file = useRef<HTMLInputElement>(null);
  const [keepDuplicates, setKeepDuplicates] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();

  const importer = useMutation({
    mutationFn: (f: File) => api.importBackup(f, keepDuplicates),
    onSuccess: ({ imported, skipped }) => {
      qc.invalidateQueries();
      toast(`Imported ${imported} recipe(s)${skipped ? `, skipped ${skipped} existing` : ''}`, 'success');
    },
    onError: (e) => toast((e as Error).message, 'error'),
    onSettled: () => {
      if (file.current) file.current.value = '';
    },
  });

  return (
    <section className="card p-4">
      <h2 className="font-display text-lg font-semibold">Backup</h2>
      <p className="mt-1 text-sm text-stone-500">
        Export all recipes (including images) as one JSON file, or import a file exported before.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href="/api/backup/export" download className="btn-primary">
          <Download size={18} /> Export JSON
        </a>
        <button className="btn-secondary" disabled={importer.isPending} onClick={() => file.current?.click()}>
          {importer.isPending ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />} Import JSON
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => e.target.files?.[0] && importer.mutate(e.target.files[0])}
        />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 accent-amber-700"
          checked={keepDuplicates}
          onChange={(e) => setKeepDuplicates(e.target.checked)}
        />
        Also import recipes whose title already exists
      </label>
    </section>
  );
}

function CatalogSection() {
  const catalog = useQuery({ queryKey: ['catalog'], queryFn: api.catalog });
  const [filter, setFilter] = useState('');
  const qc = useQueryClient();
  const toast = useToast();
  const onError = (e: unknown) => toast((e as Error).message, 'error');

  const update = useMutation({
    mutationFn: ({ id, ...patch }: { id: number; name?: string; category?: Category }) => api.updateCatalog(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['catalog'] });
      qc.invalidateQueries({ queryKey: ['recipe'] });
    },
    onError,
  });
  const remove = useMutation({
    mutationFn: (id: number) => api.deleteCatalog(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['catalog'] }),
    onError,
  });

  const rows = (catalog.data ?? []).filter((c) => c.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <section className="card p-4">
      <h2 className="font-display text-lg font-semibold">Ingredients</h2>
      <p className="mt-1 text-sm text-stone-500">
        Every ingredient is spelled the same across recipes so the shopping list can combine them. The category decides
        where it appears on the shopping list.
      </p>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400" size={18} />
        <input className="input pl-10" placeholder="Filter ingredients" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      <ul className="mt-3 divide-y divide-stone-900/5 dark:divide-white/5">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center gap-2 py-2">
            <input
              className="input flex-1 border-transparent bg-transparent px-2 py-1 hover:border-stone-300 dark:bg-transparent dark:hover:border-stone-700"
              defaultValue={c.name}
              aria-label={`Name of ${c.name}`}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== c.name) update.mutate({ id: c.id, name });
                else e.target.value = c.name;
              }}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            />
            <select
              className="input w-auto py-1 text-sm"
              value={c.category}
              aria-label={`Category of ${c.name}`}
              onChange={(e) => update.mutate({ id: c.id, category: e.target.value as Category })}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            <span className="w-10 text-right text-xs text-stone-500 tabular-nums" title="Used in recipes">
              {c.usage}×
            </span>
            <button
              className="icon-btn h-8 w-8 hover:text-red-600 disabled:opacity-30"
              disabled={c.usage > 0}
              title={c.usage > 0 ? 'Still used in recipes' : 'Delete'}
              aria-label={`Delete ${c.name}`}
              onClick={() => remove.mutate(c.id)}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
        {!rows.length && <li className="py-4 text-center text-sm text-stone-500">No ingredients.</li>}
      </ul>
    </section>
  );
}
