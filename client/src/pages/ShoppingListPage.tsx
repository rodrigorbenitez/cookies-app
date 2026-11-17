import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCheck, Copy, Minus, Plus, Share2, ShoppingBasket, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { CATEGORIES, CATEGORY_LABELS, UNITS, type ShoppingItem, type ShoppingList } from '../lib/types';
import { formatQuantity } from '../lib/format';
import { useToast } from '../components/Toast';
import { useSelection } from '../lib/selection';

const KEY = ['shopping-list'];

/** "2 kg apples" -> { amount: 2, unit: 'kg', name: 'apples' }, "milk" -> { name: 'milk' } */
export function parseManualItem(text: string) {
  const t = text.trim();
  const m = t.match(/^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+\b)?\s+(.+)$/);
  if (!m) return { name: t, amount: null, unit: null };
  const amount = Number(m[1].replace(',', '.'));
  const unit = m[2] && (UNITS as readonly string[]).includes(m[2].toLowerCase()) ? m[2].toLowerCase() : null;
  const name = unit ? m[3] : `${m[2] ? `${m[2]} ` : ''}${m[3]}`;
  return { name: name.trim(), amount, unit: unit ?? 'piece' };
}

function listAsText(list: ShoppingList) {
  const lines = ['Shopping list', ''];
  for (const cat of CATEGORIES) {
    const items = list.items.filter((i) => i.category === cat && !i.checked);
    if (!items.length) continue;
    lines.push(CATEGORY_LABELS[cat]);
    for (const i of items) {
      const q = formatQuantity(i.amount, i.unit);
      lines.push(`- ${q ? `${q} ` : ''}${i.name}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

export function ShoppingListPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const selection = useSelection();
  const list = useQuery({ queryKey: KEY, queryFn: api.shoppingList });
  const [newItem, setNewItem] = useState('');

  const onError = (e: unknown) => toast((e as Error).message, 'error');
  const setList = (data: ShoppingList) => qc.setQueryData(KEY, data);

  const toggle = useMutation({
    mutationFn: (item: ShoppingItem) => api.updateShoppingItem(item.id, { checked: !item.checked }),
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData<ShoppingList>(KEY);
      if (prev) setList({ ...prev, items: prev.items.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)) });
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) setList(ctx.prev);
      onError(e);
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.deleteShoppingItem(id),
    onMutate: async (id) => {
      const prev = qc.getQueryData<ShoppingList>(KEY);
      if (prev) setList({ ...prev, items: prev.items.filter((i) => i.id !== id) });
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) setList(ctx.prev);
      onError(e);
    },
  });

  const add = useMutation({
    mutationFn: (text: string) => api.addShoppingItem(parseManualItem(text)),
    onSuccess: () => {
      setNewItem('');
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError,
  });

  const regenerate = useMutation({
    mutationFn: (recipes: { id: number; servings: number }[]) => api.generateShoppingList(recipes),
    onSuccess: setList,
    onError,
  });
  const clearChecked = useMutation({ mutationFn: api.clearChecked, onSuccess: setList, onError });
  const clearAll = useMutation({ mutationFn: api.clearShoppingList, onSuccess: setList, onError });

  // Debounced regenerate when servings change.
  const pending = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(pending.current), []);
  const changeServings = (recipeId: number, servings: number) => {
    const data = qc.getQueryData<ShoppingList>(KEY);
    if (!data) return;
    const recipes = data.recipes.map((r) => (r.recipeId === recipeId ? { ...r, servings: Math.max(1, servings) } : r));
    setList({ ...data, recipes });
    clearTimeout(pending.current);
    pending.current = setTimeout(() => regenerate.mutate(recipes.map((r) => ({ id: r.recipeId, servings: r.servings }))), 400);
  };
  const removeRecipe = (recipeId: number) => {
    const data = qc.getQueryData<ShoppingList>(KEY);
    if (!data) return;
    regenerate.mutate(data.recipes.filter((r) => r.recipeId !== recipeId).map((r) => ({ id: r.recipeId, servings: r.servings })));
  };

  const share = async () => {
    if (!list.data) return;
    const text = listAsText(list.data);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Shopping list', text });
        return;
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard', 'success');
    } catch {
      toast('Could not copy the list', 'error');
    }
  };

  const addMoreRecipes = () => {
    selection.clear();
    for (const r of list.data?.recipes ?? []) selection.toggle({ id: r.recipeId, title: r.title, servings: r.servings });
    selection.setActive(true);
    navigate('/');
  };

  if (list.isPending) return <div className="py-20 text-center text-stone-500">Loading…</div>;
  if (list.isError) return <div className="py-20 text-center text-stone-500">{(list.error as Error).message}</div>;

  const { items, recipes } = list.data;
  const checkedCount = items.filter((i) => i.checked).length;
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="mr-auto font-display text-2xl font-semibold">Shopping list</h1>
        {items.length > 0 && (
          <>
            <button className="btn-secondary px-3" onClick={share}>
              {canShare ? <Share2 size={18} /> : <Copy size={18} />} {canShare ? 'Share' : 'Copy'}
            </button>
            <button
              className="icon-btn"
              title="Remove checked items"
              aria-label="Remove checked items"
              disabled={!checkedCount}
              onClick={() => clearChecked.mutate()}
            >
              <CheckCheck size={20} />
            </button>
            <button
              className="icon-btn hover:text-red-600"
              title="Clear the whole list"
              aria-label="Clear the whole list"
              onClick={() => confirm('Clear the whole shopping list?') && clearAll.mutate()}
            >
              <Trash2 size={20} />
            </button>
          </>
        )}
      </div>

      <form
        className="mb-5 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (newItem.trim()) add.mutate(newItem);
        }}
      >
        <input
          className="input"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add item, e.g. 2 kg apples"
          aria-label="Add item"
          enterKeyHint="done"
        />
        <button className="btn-primary px-3" disabled={!newItem.trim() || add.isPending} aria-label="Add item">
          <Plus size={20} />
        </button>
      </form>

      {recipes.length > 0 && (
        <section className="card mb-5 p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold tracking-wide text-stone-500 uppercase">From recipes</h2>
            <button className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-400" onClick={addMoreRecipes}>
              Change recipes
            </button>
          </div>
          <ul className="divide-y divide-stone-900/5 dark:divide-white/5">
            {recipes.map((r) => (
              <li key={r.recipeId} className="flex items-center gap-1 py-1.5">
                <Link to={`/recipes/${r.recipeId}`} className="flex-1 truncate px-1 font-medium hover:underline">
                  {r.title}
                </Link>
                <button className="icon-btn h-8 w-8" onClick={() => changeServings(r.recipeId, r.servings - 1)} aria-label="Fewer servings">
                  <Minus size={16} />
                </button>
                <span className="w-16 text-center text-sm tabular-nums">
                  <span className="font-semibold">{r.servings}</span> serv.
                </span>
                <button className="icon-btn h-8 w-8" onClick={() => changeServings(r.recipeId, r.servings + 1)} aria-label="More servings">
                  <Plus size={16} />
                </button>
                <button className="icon-btn h-8 w-8" onClick={() => removeRecipe(r.recipeId)} aria-label={`Remove ${r.title}`}>
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {items.length === 0 ? (
        <div className="py-12 text-center">
          <ShoppingBasket className="mx-auto text-stone-300 dark:text-stone-600" size={56} strokeWidth={1.25} />
          <p className="mt-3 font-display text-xl text-stone-700 dark:text-stone-200">Your list is empty</p>
          <p className="mt-1 text-stone-500">Select recipes in the recipe list or add items above.</p>
          <button className="btn-primary mt-4" onClick={addMoreRecipes}>
            Choose recipes
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {CATEGORIES.map((cat) => {
            const catItems = items
              .filter((i) => i.category === cat)
              .sort((a, b) => Number(a.checked) - Number(b.checked));
            if (!catItems.length) return null;
            return (
              <section key={cat}>
                <h2 className="mb-1.5 px-1 text-sm font-semibold tracking-wide text-amber-800 uppercase dark:text-amber-400">
                  {CATEGORY_LABELS[cat]}
                </h2>
                <ul className="card divide-y divide-stone-900/5 overflow-hidden dark:divide-white/5">
                  {catItems.map((item) => (
                    <li key={item.id} className="flex items-center">
                      <button
                        className={`flex flex-1 items-center gap-3 px-3 py-3 text-left transition ${item.checked ? 'opacity-45' : ''}`}
                        onClick={() => toggle.mutate(item)}
                        role="checkbox"
                        aria-checked={item.checked}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                            item.checked ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-stone-300 dark:border-stone-600'
                          }`}
                        >
                          {item.checked && <Check size={16} strokeWidth={3} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block ${item.checked ? 'line-through' : ''}`}>
                            {formatQuantity(item.amount, item.unit) && (
                              <span className="font-semibold tabular-nums">{formatQuantity(item.amount, item.unit)} </span>
                            )}
                            {item.name}
                          </span>
                          {item.sources.length > 0 && (
                            <span className="block truncate text-xs text-stone-500">{item.sources.join(' · ')}</span>
                          )}
                        </span>
                      </button>
                      <button className="icon-btn mr-1 h-9 w-9 shrink-0" onClick={() => remove.mutate(item.id)} aria-label={`Remove ${item.name}`}>
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
