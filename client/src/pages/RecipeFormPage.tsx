import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowLeft, ArrowUp, Bold, Eye, Heading2, ListOrdered, Loader2, Plus, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { UNITS, type Recipe, type RecipeInput, type Unit } from '../lib/types';
import { useRecipe } from '../lib/useRecipe';
import { ImagePicker } from '../components/ImagePicker';
import { TagInput } from '../components/TagInput';
import { StarRating } from '../components/StarRating';
import { Autocomplete } from '../components/Autocomplete';
import { Markdown } from '../components/Markdown';
import { useToast } from '../components/Toast';

let keySeq = 0;
const nextKey = () => ++keySeq;

interface IngredientRow {
  key: number;
  amount: string;
  unit: Unit;
  name: string;
  note: string;
}
interface GroupRow {
  key: number;
  name: string;
  ingredients: IngredientRow[];
}
interface FormState {
  title: string;
  imagePath: string | null;
  tags: string[];
  rating: number | null;
  servings: string;
  prepTime: string;
  instructions: string;
  groups: GroupRow[];
}

const emptyIngredient = (): IngredientRow => ({ key: nextKey(), amount: '', unit: 'g', name: '', note: '' });
const emptyGroup = (name = ''): GroupRow => ({ key: nextKey(), name, ingredients: [emptyIngredient()] });

const emptyForm = (): FormState => ({
  title: '',
  imagePath: null,
  tags: [],
  rating: null,
  servings: '4',
  prepTime: '',
  instructions: '',
  groups: [emptyGroup()],
});

function fromRecipe(r: Recipe): FormState {
  return {
    title: r.title,
    imagePath: r.imagePath,
    tags: r.tags,
    rating: r.rating,
    servings: String(r.servings),
    prepTime: r.prepTime ? String(r.prepTime) : '',
    instructions: r.instructions,
    groups: r.ingredientGroups.length
      ? r.ingredientGroups.map((g) => ({
          key: nextKey(),
          name: g.name,
          ingredients: g.ingredients.map((i) => ({
            key: nextKey(),
            amount: i.amount == null ? '' : String(i.amount),
            unit: i.unit,
            name: i.name,
            note: i.note ?? '',
          })),
        }))
      : [emptyGroup()],
  };
}

function parseAmount(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  // Allow simple fractions like "1/2" or "1 1/2".
  const mixed = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = t.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const n = Number(t);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function toInput(f: FormState): RecipeInput {
  return {
    title: f.title.trim(),
    imagePath: f.imagePath,
    tags: f.tags,
    rating: f.rating,
    servings: Math.max(1, parseInt(f.servings, 10) || 1),
    prepTime: f.prepTime ? Math.max(0, parseInt(f.prepTime, 10) || 0) : null,
    instructions: f.instructions,
    ingredientGroups: f.groups
      .map((g) => ({
        name: g.name.trim(),
        ingredients: g.ingredients
          .filter((i) => i.name.trim())
          .map((i) => ({
            amount: i.unit === 'to taste' ? null : parseAmount(i.amount),
            unit: i.unit,
            name: i.name.trim(),
            note: i.note.trim() || null,
          })),
      }))
      .filter((g) => g.name || g.ingredients.length),
  };
}

function move<T>(arr: T[], index: number, delta: number): T[] {
  const to = index + delta;
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  [copy[index], copy[to]] = [copy[to], copy[index]];
  return copy;
}

export function RecipeFormPage() {
  const params = useParams();
  const editingId = params.id ? Number(params.id) : null;
  const existing = useRecipe(editingId ?? NaN);
  const [form, setForm] = useState<FormState | null>(editingId ? null : emptyForm());
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const tags = useQuery({ queryKey: ['tags'], queryFn: api.tags });
  const catalog = useQuery({ queryKey: ['catalog'], queryFn: api.catalog });

  useEffect(() => {
    if (editingId && existing.data && !form) setForm(fromRecipe(existing.data));
  }, [editingId, existing.data, form]);

  const save = useMutation({
    mutationFn: (input: RecipeInput) => (editingId ? api.updateRecipe(editingId, input) : api.createRecipe(input)),
    onSuccess: (recipe) => {
      qc.setQueryData(['recipe', recipe.id], recipe);
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: ['tags'] });
      qc.invalidateQueries({ queryKey: ['catalog'] });
      toast(editingId ? 'Recipe saved' : 'Recipe created', 'success');
      navigate(`/recipes/${recipe.id}`, { replace: true });
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  if (!form) {
    return <div className="py-20 text-center text-stone-500">{existing.isError ? (existing.error as Error).message : 'Loading…'}</div>;
  }

  const set = (patch: Partial<FormState>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setGroups = (fn: (groups: GroupRow[]) => GroupRow[]) => setForm((f) => (f ? { ...f, groups: fn(f.groups) } : f));
  const updateGroup = (key: number, fn: (g: GroupRow) => GroupRow) => setGroups((gs) => gs.map((g) => (g.key === key ? fn(g) : g)));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast('Please enter a title', 'error');
      return;
    }
    save.mutate(toInput(form));
  };

  const catalogNames = catalog.data?.map((c) => c.name) ?? [];

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-2">
        <button type="button" className="icon-btn -ml-2" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-2xl font-semibold">{editingId ? 'Edit recipe' : 'New recipe'}</h1>
        <button type="submit" className="btn-primary ml-auto" disabled={save.isPending}>
          {save.isPending && <Loader2 size={18} className="animate-spin" />} Save
        </button>
      </div>

      <div className="space-y-6">
        <section className="card space-y-4 p-4">
          <ImagePicker value={form.imagePath} onChange={(imagePath) => set({ imagePath })} />
          <div>
            <label className="label" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              className="input text-lg font-semibold"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Vanilla crescent cookies"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="servings">
                Servings
              </label>
              <input
                id="servings"
                className="input"
                type="number"
                inputMode="numeric"
                min={1}
                value={form.servings}
                onChange={(e) => set({ servings: e.target.value })}
              />
            </div>
            <div>
              <label className="label" htmlFor="prepTime">
                Time (minutes)
              </label>
              <input
                id="prepTime"
                className="input"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.prepTime}
                onChange={(e) => set({ prepTime: e.target.value })}
                placeholder="e.g. 45"
              />
            </div>
          </div>
          <div>
            <span className="label">Rating</span>
            <StarRating value={form.rating} onChange={(rating) => set({ rating })} size={26} className="-ml-1" />
          </div>
          <div>
            <span className="label">Tags</span>
            <TagInput value={form.tags} onChange={(t) => set({ tags: t })} suggestions={tags.data?.map((t) => t.tag) ?? []} />
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Ingredients</h2>
          </div>
          <div className="space-y-4">
            {form.groups.map((g, gi) => (
              <div key={g.key} className="card p-3 sm:p-4">
                <div className="mb-3 flex items-center gap-1">
                  <input
                    className="input flex-1 font-semibold"
                    value={g.name}
                    onChange={(e) => updateGroup(g.key, (x) => ({ ...x, name: e.target.value }))}
                    placeholder={form.groups.length > 1 ? 'Group name, e.g. Filling' : 'Group name (optional), e.g. Dough'}
                    aria-label="Group name"
                  />
                  <button type="button" className="icon-btn" disabled={gi === 0} onClick={() => setGroups((gs) => move(gs, gi, -1))} aria-label="Move group up">
                    <ArrowUp size={18} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn"
                    disabled={gi === form.groups.length - 1}
                    onClick={() => setGroups((gs) => move(gs, gi, 1))}
                    aria-label="Move group down"
                  >
                    <ArrowDown size={18} />
                  </button>
                  <button
                    type="button"
                    className="icon-btn hover:text-red-600"
                    aria-label="Delete group"
                    onClick={() => {
                      const hasContent = g.ingredients.some((i) => i.name.trim());
                      if (!hasContent || confirm(`Delete the group “${g.name || 'Ingredients'}” and its ingredients?`)) {
                        setGroups((gs) => (gs.length > 1 ? gs.filter((x) => x.key !== g.key) : [emptyGroup()]));
                      }
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <ul className="space-y-2">
                  {g.ingredients.map((ing, ii) => (
                    <IngredientRowEditor
                      key={ing.key}
                      row={ing}
                      catalogNames={catalogNames}
                      first={ii === 0}
                      last={ii === g.ingredients.length - 1}
                      onChange={(row) =>
                        updateGroup(g.key, (x) => ({ ...x, ingredients: x.ingredients.map((r) => (r.key === ing.key ? row : r)) }))
                      }
                      onMove={(d) => updateGroup(g.key, (x) => ({ ...x, ingredients: move(x.ingredients, ii, d) }))}
                      onRemove={() => updateGroup(g.key, (x) => ({ ...x, ingredients: x.ingredients.filter((r) => r.key !== ing.key) }))}
                      onEnter={() =>
                        ii === g.ingredients.length - 1 &&
                        updateGroup(g.key, (x) => ({ ...x, ingredients: [...x.ingredients, emptyIngredient()] }))
                      }
                    />
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn-ghost mt-2 px-2 text-amber-800 dark:text-amber-300"
                  onClick={() => updateGroup(g.key, (x) => ({ ...x, ingredients: [...x.ingredients, emptyIngredient()] }))}
                >
                  <Plus size={18} /> Add ingredient
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="btn-secondary mt-3 w-full" onClick={() => setGroups((gs) => [...gs, emptyGroup()])}>
            <Plus size={18} /> Add ingredient group
          </button>
        </section>

        <InstructionsEditor value={form.instructions} onChange={(instructions) => set({ instructions })} />

        <div className="flex gap-2">
          <button type="button" className="btn-secondary flex-1" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={save.isPending}>
            {save.isPending && <Loader2 size={18} className="animate-spin" />} Save recipe
          </button>
        </div>
      </div>
    </form>
  );
}

function IngredientRowEditor({
  row,
  catalogNames,
  first,
  last,
  onChange,
  onMove,
  onRemove,
  onEnter,
}: {
  row: IngredientRow;
  catalogNames: string[];
  first: boolean;
  last: boolean;
  onChange: (row: IngredientRow) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
  onEnter: () => void;
}) {
  const [showNote, setShowNote] = useState(!!row.note);
  const noAmount = row.unit === 'to taste';
  return (
    <li className="rounded-xl bg-stone-100/70 p-2 dark:bg-white/5">
      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
        <input
          className="input w-20 shrink-0 px-2 text-right"
          inputMode="decimal"
          placeholder={noAmount ? '–' : 'Amt.'}
          aria-label="Amount"
          disabled={noAmount}
          value={noAmount ? '' : row.amount}
          onChange={(e) => onChange({ ...row, amount: e.target.value })}
        />
        <select
          className="input w-28 shrink-0 px-2"
          aria-label="Unit"
          value={row.unit}
          onChange={(e) => onChange({ ...row, unit: e.target.value as Unit })}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <div className="min-w-40 flex-1">
          <Autocomplete
            value={row.name}
            onChange={(name) => onChange({ ...row, name })}
            options={catalogNames}
            placeholder="Ingredient"
            aria-label="Ingredient"
            enterKeyHint="next"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onEnter();
              }
            }}
          />
        </div>
      </div>
      <div className="mt-1.5 flex items-center gap-1">
        {showNote ? (
          <input
            className="input flex-1 py-1.5 text-sm"
            placeholder="Note, e.g. room temperature"
            aria-label="Note"
            value={row.note}
            onChange={(e) => onChange({ ...row, note: e.target.value })}
            autoFocus={!row.note}
          />
        ) : (
          <button type="button" className="mr-auto px-1 text-sm text-stone-500 hover:text-amber-700" onClick={() => setShowNote(true)}>
            + Note
          </button>
        )}
        <button type="button" className="icon-btn h-8 w-8" disabled={first} onClick={() => onMove(-1)} aria-label="Move up">
          <ArrowUp size={16} />
        </button>
        <button type="button" className="icon-btn h-8 w-8" disabled={last} onClick={() => onMove(1)} aria-label="Move down">
          <ArrowDown size={16} />
        </button>
        <button type="button" className="icon-btn h-8 w-8 hover:text-red-600" onClick={onRemove} aria-label="Remove ingredient">
          <X size={16} />
        </button>
      </div>
    </li>
  );
}

function InstructionsEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [preview, setPreview] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  /** Inserts Markdown at the cursor: wraps the selection or prefixes the current line. */
  const apply = (kind: 'heading' | 'list' | 'bold') => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    let next: string;
    let cursor: number;
    if (kind === 'bold') {
      const sel = value.slice(s, e) || 'bold';
      next = `${value.slice(0, s)}**${sel}**${value.slice(e)}`;
      cursor = s + sel.length + 4;
    } else {
      const lineStart = value.lastIndexOf('\n', s - 1) + 1;
      let prefix = '## ';
      if (kind === 'list') {
        const before = value.slice(0, lineStart).split('\n').reverse();
        const prev = before.find((l) => l.trim() !== '' || false) ?? '';
        const m = prev.match(/^(\d+)\.\s/);
        prefix = `${m ? Number(m[1]) + 1 : 1}. `;
      }
      next = `${value.slice(0, lineStart)}${prefix}${value.slice(lineStart)}`;
      cursor = s + prefix.length;
    }
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  };

  return (
    <section>
      <div className="mb-2 flex items-center gap-1">
        <h2 className="mr-auto font-display text-xl font-semibold">Instructions</h2>
        {!preview && (
          <>
            <button type="button" className="icon-btn" onClick={() => apply('heading')} aria-label="Heading" title="Heading">
              <Heading2 size={18} />
            </button>
            <button type="button" className="icon-btn" onClick={() => apply('list')} aria-label="Numbered step" title="Numbered step">
              <ListOrdered size={18} />
            </button>
            <button type="button" className="icon-btn" onClick={() => apply('bold')} aria-label="Bold" title="Bold">
              <Bold size={18} />
            </button>
          </>
        )}
        <button
          type="button"
          className={`btn-ghost px-3 ${preview ? 'bg-amber-100 dark:bg-amber-500/15' : ''}`}
          onClick={() => setPreview((v) => !v)}
          aria-pressed={preview}
        >
          <Eye size={18} /> Preview
        </button>
      </div>
      {preview ? (
        <div className="card min-h-48 p-4">{value.trim() ? <Markdown text={value} /> : <p className="text-stone-500">Nothing to preview.</p>}</div>
      ) : (
        <>
          <textarea
            ref={ref}
            className="input min-h-72 font-mono text-sm leading-relaxed"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={'## Dough\n1. Mix flour and **cold** butter.\n2. Chill for 30 minutes.\n\n#christmas'}
          />
          <p className="mt-1 text-xs text-stone-500">
            Markdown: <code>## Heading</code>, <code>1. Step</code>, <code>**bold**</code>. Write <code>#tag</code> to add a tag.
          </p>
        </>
      )}
    </section>
  );
}
