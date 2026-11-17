import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Loader2, Monitor, Moon, Search, Snowflake, Sun, Trash2, Upload } from 'lucide-react';
import { api } from '../lib/api';
import { CATEGORIES, type Category } from '../lib/types';
import { useI18n, type Lang } from '../lib/i18n';
import { applyTheme, getTheme, type Theme } from '../lib/theme';
import { useToast } from '../components/Toast';
import { setSnowEnabled, useSnowEnabled } from '../lib/snow';

export function SettingsPage() {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-semibold">{t.settings.title}</h1>
      <LanguageSection />
      <ThemeSection />
      <BackupSection />
      <CatalogSection />
    </div>
  );
}

function LanguageSection() {
  const { t, lang, setLang } = useI18n();
  const options: { value: Lang; label: string }[] = [
    { value: 'de', label: 'Deutsch' },
    { value: 'en', label: 'English' },
  ];
  return (
    <section className="card p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">{t.settings.language}</h2>
      <div className="grid grid-cols-2 gap-2">
        {options.map(({ value, label }) => (
          <button
            key={value}
            lang={value}
            className={`btn py-3 ${
              lang === value
                ? 'bg-brand-100 text-brand-900 ring-2 ring-brand-600/40 dark:bg-brand-500/15 dark:text-brand-200'
                : 'btn-secondary'
            }`}
            onClick={() => setLang(value)}
            aria-pressed={lang === value}
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}

function ThemeSection() {
  const [theme, setTheme] = useState<Theme>(getTheme());
  const { t } = useI18n();
  const snow = useSnowEnabled();
  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: t.settings.light, icon: Sun },
    { value: 'dark', label: t.settings.dark, icon: Moon },
    { value: 'system', label: t.settings.system, icon: Monitor },
  ];
  return (
    <section className="card p-4">
      <h2 className="mb-3 font-display text-lg font-semibold">{t.settings.appearance}</h2>
      <div className="grid grid-cols-3 gap-2">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            className={`btn flex-col py-3 ${
              theme === value
                ? 'bg-brand-100 text-brand-900 ring-2 ring-brand-600/40 dark:bg-brand-500/15 dark:text-brand-200'
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
      <label className="mt-4 flex cursor-pointer items-center gap-3">
        <Snowflake size={20} className="text-sky-500" />
        <span className="flex-1">
          <span className="block font-medium">{t.settings.snow}</span>
          <span className="block text-sm text-stone-500">{t.settings.snowHint}</span>
        </span>
        <input
          type="checkbox"
          role="switch"
          className="peer sr-only"
          checked={snow}
          onChange={(e) => setSnowEnabled(e.target.checked)}
        />
        <span
          className="relative h-7 w-12 rounded-full bg-stone-300 transition peer-checked:bg-pine-600 peer-focus-visible:ring-2 peer-focus-visible:ring-pine-500/50 after:absolute after:top-1 after:left-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5 dark:bg-white/20"
          aria-hidden="true"
        />
      </label>
    </section>
  );
}

function BackupSection() {
  const file = useRef<HTMLInputElement>(null);
  const [keepDuplicates, setKeepDuplicates] = useState(false);
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useI18n();

  const importer = useMutation({
    mutationFn: (f: File) => api.importBackup(f, keepDuplicates),
    onSuccess: ({ imported, skipped }) => {
      qc.invalidateQueries();
      toast(t.settings.imported(imported, skipped), 'success');
    },
    onError: (e) => toast((e as Error).message, 'error'),
    onSettled: () => {
      if (file.current) file.current.value = '';
    },
  });

  return (
    <section className="card p-4">
      <h2 className="font-display text-lg font-semibold">{t.settings.backup}</h2>
      <p className="mt-1 text-sm text-stone-500">
        {t.settings.backupHint}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href="/api/backup/export" download className="btn-primary">
          <Download size={18} /> {t.settings.exportJson}
        </a>
        <button className="btn-secondary" disabled={importer.isPending} onClick={() => file.current?.click()}>
          {importer.isPending ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />} {t.settings.importJson}
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
          className="h-4 w-4 accent-brand-700"
          checked={keepDuplicates}
          onChange={(e) => setKeepDuplicates(e.target.checked)}
        />
        {t.settings.keepDuplicates}
      </label>
    </section>
  );
}

function CatalogSection() {
  const catalog = useQuery({ queryKey: ['catalog'], queryFn: api.catalog });
  const [filter, setFilter] = useState('');
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useI18n();
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
      <h2 className="font-display text-lg font-semibold">{t.settings.ingredients}</h2>
      <p className="mt-1 text-sm text-stone-500">
        {t.settings.ingredientsHint}
      </p>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400" size={18} />
        <input className="input pl-10" placeholder={t.settings.filterIngredients} value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      <ul className="mt-3 divide-y divide-stone-900/5 dark:divide-white/5">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center gap-2 py-2">
            <input
              className="input flex-1 border-transparent bg-transparent px-2 py-1 hover:border-stone-300 dark:bg-transparent dark:hover:border-stone-700"
              defaultValue={c.name}
              aria-label={t.settings.nameOf(c.name)}
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
              aria-label={t.settings.categoryOf(c.name)}
              onChange={(e) => update.mutate({ id: c.id, category: e.target.value as Category })}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t.categories[cat]}
                </option>
              ))}
            </select>
            <span className="w-10 text-right text-xs text-stone-500 tabular-nums" title={t.settings.usedIn}>
              {c.usage}×
            </span>
            <button
              className="icon-btn h-8 w-8 hover:text-red-600 disabled:opacity-30"
              disabled={c.usage > 0}
              title={c.usage > 0 ? t.settings.stillUsed : t.detail.delete}
              aria-label={t.settings.deleteItem(c.name)}
              onClick={() => remove.mutate(c.id)}
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
        {!rows.length && <li className="py-4 text-center text-sm text-stone-500">{t.settings.noIngredients}</li>}
      </ul>
    </section>
  );
}
