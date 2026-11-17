import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  ChevronUp,
  Clock,
  ListChecks,
  Minus,
  Plus,
  Search,
  ShoppingBasket,
  SlidersHorizontal,
  TreePine,
  X,
} from 'lucide-react';
import { api, imageUrl } from '../lib/api';
import type { RecipeFilters, RecipeSummary, SortOrder } from '../lib/types';
import { StarRating } from '../components/StarRating';
import { RecipeImage } from '../components/RecipeImage';
import { Autocomplete } from '../components/Autocomplete';
import { useSelection } from '../lib/selection';
import { useToast } from '../components/Toast';
import { formatTime } from '../lib/format';
import { useI18n } from '../lib/i18n';

function useFilters(): [RecipeFilters, (patch: Partial<RecipeFilters>) => void] {
  const [params, setParams] = useSearchParams();
  const filters: RecipeFilters = {
    q: params.get('q') ?? '',
    tags: params.get('tags')?.split(',').filter(Boolean) ?? [],
    minRating: Number(params.get('minRating')) || undefined,
    ingredient: params.get('ingredient') ?? '',
    sort: (params.get('sort') as SortOrder) || 'recent',
  };
  const update = (patch: Partial<RecipeFilters>) => {
    const next = { ...filters, ...patch };
    const p = new URLSearchParams();
    if (next.q) p.set('q', next.q);
    if (next.tags?.length) p.set('tags', next.tags.join(','));
    if (next.minRating) p.set('minRating', String(next.minRating));
    if (next.ingredient) p.set('ingredient', next.ingredient);
    if (next.sort && next.sort !== 'recent') p.set('sort', next.sort);
    setParams(p, { replace: true });
  };
  return [filters, update];
}

/** Loads every recipe detail and image once per session so they're available offline. */
function usePrefetchForOffline(recipes: RecipeSummary[] | undefined, unfiltered: boolean) {
  const qc = useQueryClient();
  const done = useRef(false);
  useEffect(() => {
    if (!recipes || !unfiltered || done.current || !navigator.onLine) return;
    done.current = true;
    let cancelled = false;
    (async () => {
      for (const r of recipes) {
        if (cancelled) return;
        await qc.prefetchQuery({ queryKey: ['recipe', r.id], queryFn: () => api.getRecipe(r.id) }).catch(() => {});
        const src = imageUrl(r.imagePath);
        if (src) new Image().src = src;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recipes, unfiltered, qc]);
}

export function RecipeListPage() {
  const [filters, setFilters] = useFilters();
  const [search, setSearch] = useState(filters.q ?? '');
  const [showFilters, setShowFilters] = useState(false);
  const selection = useSelection();
  const { t, tError } = useI18n();

  // Debounce search input into the URL.
  useEffect(() => {
    const t = setTimeout(() => search !== filters.q && setFilters({ q: search }), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const recipes = useQuery({ queryKey: ['recipes', filters], queryFn: () => api.listRecipes(filters) });
  const tags = useQuery({ queryKey: ['tags'], queryFn: api.tags });
  const catalog = useQuery({ queryKey: ['catalog'], queryFn: api.catalog });

  const filterCount = (filters.tags?.length ?? 0) + (filters.minRating ? 1 : 0) + (filters.ingredient ? 1 : 0);
  const unfiltered = !filters.q && filterCount === 0;
  usePrefetchForOffline(recipes.data, unfiltered);

  const toggleTag = (tag: string) => {
    const cur = filters.tags ?? [];
    setFilters({ tags: cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag] });
  };

  return (
    <div>
      {filterCount === 0 && (
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine-100 dark:bg-pine-500/15">
            <TreePine className="text-pine-700 dark:text-pine-300" size={24} />
          </span>
          <div>
            <p className="font-display text-2xl leading-tight font-semibold text-brand-700 dark:text-brand-400">{t.list.greeting}</p>
            <p className="text-sm text-stone-500 dark:text-stone-400">{t.list.greetingSub}</p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="search"
            className="input pl-10"
            placeholder={t.list.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            enterKeyHint="search"
          />
        </div>
        <button
          className={`btn-secondary relative px-3 ${showFilters ? 'ring-2 ring-brand-600/40' : ''}`}
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-label={t.list.filtersAria}
        >
          <SlidersHorizontal size={18} />
          <span className="hidden sm:inline">{t.list.filters}</span>
          {filterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-xs text-white">
              {filterCount}
            </span>
          )}
        </button>
        <button
          className={`btn-secondary px-3 ${selection.active ? 'bg-brand-700! text-white!' : ''}`}
          onClick={() => selection.setActive(!selection.active)}
          aria-pressed={selection.active}
          title={t.list.selectTitle}
        >
          <ListChecks size={18} />
          <span className="hidden sm:inline">{t.list.select}</span>
        </button>
        <Link to="/recipes/new" className="btn-primary hidden md:inline-flex">
          <Plus size={18} /> {t.list.newRecipe}
        </Link>
      </div>

      {showFilters && (
        <div className="card mt-3 space-y-4 p-4">
          <div>
            <span className="label">{t.list.tagsAll}</span>
            <div className="flex flex-wrap gap-1.5">
              {tags.data?.length ? (
                tags.data.map(({ tag, count }) => {
                  const on = filters.tags?.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                        on
                          ? 'bg-brand-700 text-white dark:bg-brand-600'
                          : 'bg-stone-200/70 text-stone-700 hover:bg-stone-300/70 dark:bg-white/10 dark:text-stone-200'
                      }`}
                    >
                      #{tag} <span className="opacity-60">{count}</span>
                    </button>
                  );
                })
              ) : (
                <span className="text-sm text-stone-500">{t.list.noTags}</span>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <span className="label">{t.list.minRating}</span>
              <StarRating value={filters.minRating ?? null} onChange={(v) => setFilters({ minRating: v ?? undefined })} size={22} />
            </div>
            <div>
              <label className="label" htmlFor="filter-ingredient">
                {t.list.containsIngredient}
              </label>
              <Autocomplete
                id="filter-ingredient"
                value={filters.ingredient ?? ''}
                onChange={(v) => setFilters({ ingredient: v })}
                options={catalog.data?.map((c) => c.name) ?? []}
                placeholder={t.list.ingredientPlaceholder}
              />
            </div>
            <div>
              <label className="label" htmlFor="sort">
                {t.list.sortBy}
              </label>
              <select
                id="sort"
                className="input"
                value={filters.sort}
                onChange={(e) => setFilters({ sort: e.target.value as SortOrder })}
              >
                <option value="recent">{t.list.sortRecent}</option>
                <option value="name">{t.list.sortName}</option>
                <option value="rating">{t.list.sortRating}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {filterCount > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {filters.tags?.map((t) => (
            <button key={t} className="chip" onClick={() => toggleTag(t)}>
              #{t} <X size={14} />
            </button>
          ))}
          {filters.minRating && (
            <button className="chip" onClick={() => setFilters({ minRating: undefined })}>
              ≥ {filters.minRating}★ <X size={14} />
            </button>
          )}
          {filters.ingredient && (
            <button className="chip" onClick={() => setFilters({ ingredient: '' })}>
              {t.list.withIngredient(filters.ingredient)} <X size={14} />
            </button>
          )}
          <button
            className="ml-1 text-sm text-stone-500 underline-offset-2 hover:underline"
            onClick={() => setFilters({ tags: [], minRating: undefined, ingredient: '' })}
          >
            {t.list.clearAll}
          </button>
        </div>
      )}

      <div className="mt-4">
        {recipes.isPending ? (
          <Grid>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="card animate-pulse overflow-hidden">
                <div className="aspect-[4/3] bg-stone-200 dark:bg-white/5" />
                <div className="space-y-2 p-3">
                  <div className="h-5 w-2/3 rounded bg-stone-200 dark:bg-white/5" />
                  <div className="h-4 w-1/3 rounded bg-stone-200 dark:bg-white/5" />
                </div>
              </div>
            ))}
          </Grid>
        ) : recipes.isError ? (
          <p className="py-16 text-center text-stone-500">
            {t.list.loadError} {tError((recipes.error as Error).message)}
          </p>
        ) : recipes.data.length === 0 ? (
          <EmptyState filtered={!unfiltered} />
        ) : (
          <Grid>
            {recipes.data.map((r) => (
              <RecipeCard key={r.id} recipe={r} onTag={toggleTag} />
            ))}
          </Grid>
        )}
      </div>

      {!selection.active && (
        <Link
          to="/recipes/new"
          aria-label={t.list.newRecipe}
          className="fixed right-4 bottom-20 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg shadow-brand-900/30 active:scale-95 md:hidden dark:bg-brand-600"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <Plus size={26} />
        </Link>
      )}
      {selection.active && <SelectionBar />}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
}

function EmptyState({ filtered }: { filtered: boolean }) {
  const { t } = useI18n();
  return (
    <div className="py-16 text-center">
      <TreePine className="mx-auto mb-3 text-pine-600/60 dark:text-pine-400/60" size={56} strokeWidth={1.25} />
      <p className="font-display text-xl text-stone-700 dark:text-stone-200">
        {filtered ? t.list.emptyFilteredTitle : t.list.emptyTitle}
      </p>
      <p className="mt-1 text-stone-500">{filtered ? t.list.emptyFilteredHint : t.list.emptyHint}</p>
      {!filtered && (
        <Link to="/recipes/new" className="btn-primary mt-4">
          <Plus size={18} /> {t.list.newRecipe}
        </Link>
      )}
    </div>
  );
}

function RecipeCard({ recipe, onTag }: { recipe: RecipeSummary; onTag: (tag: string) => void }) {
  const selection = useSelection();
  const selected = selection.isSelected(recipe.id);
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const time = formatTime(recipe.prepTime, lang);

  const open = () => {
    if (selection.active) selection.toggle({ id: recipe.id, title: recipe.title, servings: recipe.servings });
    else navigate(`/recipes/${recipe.id}`);
  };

  return (
    <article
      className={`card group relative flex cursor-pointer flex-col overflow-hidden transition hover:shadow-md ${
        selected ? 'ring-2! ring-brand-600!' : ''
      }`}
      onClick={open}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <RecipeImage path={recipe.imagePath} id={recipe.id} className="h-full w-full transition duration-300 group-hover:scale-[1.03]" />
        {selection.active && (
          <span
            className={`absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full border-2 shadow ${
              selected ? 'border-brand-600 bg-brand-600 text-white' : 'border-white bg-black/20 text-transparent'
            }`}
            role="checkbox"
            aria-checked={selected}
            aria-label={t.list.selectRecipe(recipe.title)}
          >
            <Check size={16} strokeWidth={3} />
          </span>
        )}
        {time && (
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            <Clock size={12} /> {time}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link
          to={`/recipes/${recipe.id}`}
          onClick={(e) => {
            e.preventDefault();
          }}
          className="font-display text-base leading-snug font-semibold text-stone-900 sm:text-lg dark:text-stone-50"
        >
          {recipe.title}
        </Link>
        {recipe.rating ? <StarRating value={recipe.rating} size={14} /> : null}
        {recipe.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-1">
            {recipe.tags.slice(0, 4).map((t) => (
              <button
                key={t}
                className="text-xs font-medium text-pine-700 hover:underline dark:text-pine-300"
                onClick={(e) => {
                  e.stopPropagation();
                  onTag(t);
                }}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function SelectionBar() {
  const selection = useSelection();
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const { t } = useI18n();
  const count = selection.selected.length;

  const generate = useMutation({
    mutationFn: () => api.generateShoppingList(selection.selected.map((s) => ({ id: s.id, servings: s.servings }))),
    onSuccess: (data) => {
      qc.setQueryData(['shopping-list'], data);
      selection.clear();
      selection.setActive(false);
      navigate('/shopping');
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const summary = useMemo(() => t.selection.count(count), [count, t]);

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-50 border-t border-stone-900/10 bg-cream-50 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-night-900">
      <div className="mx-auto max-w-3xl px-4 py-3">
        {expanded && count > 0 && (
          <ul className="mb-3 max-h-64 space-y-2 overflow-auto">
            {selection.selected.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                <span className="flex-1 truncate font-medium">{s.title}</span>
                <span className="text-sm text-stone-500">{t.servings.label}</span>
                <button className="icon-btn h-8 w-8" onClick={() => selection.setServings(s.id, s.servings - 1)} aria-label={t.servings.fewer}>
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-semibold tabular-nums">{s.servings}</span>
                <button className="icon-btn h-8 w-8" onClick={() => selection.setServings(s.id, s.servings + 1)} aria-label={t.servings.more}>
                  <Plus size={16} />
                </button>
                <button className="icon-btn h-8 w-8" onClick={() => selection.toggle(s)} aria-label={t.common.remove(s.title)}>
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-2">
          <button className="btn-ghost flex-1 justify-start px-2" onClick={() => setExpanded((v) => !v)} disabled={!count}>
            <ChevronUp size={18} className={`transition ${expanded ? 'rotate-180' : ''}`} />
            {count ? summary : t.selection.hint}
          </button>
          <button className="btn-ghost" onClick={() => selection.setActive(false)}>
            {t.common.cancel}
          </button>
          <button className="btn-primary" disabled={!count || generate.isPending} onClick={() => generate.mutate()}>
            <ShoppingBasket size={18} /> <span className="hidden sm:inline">{t.selection.shoppingList}</span>
            <span className="sm:hidden">{t.selection.list}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
