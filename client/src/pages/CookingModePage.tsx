import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Sun, SunDim, X } from 'lucide-react';
import { useRecipe } from '../lib/useRecipe';
import { useWakeLock } from '../lib/useWakeLock';
import { IngredientList } from '../components/IngredientList';
import { ServingsStepper } from '../components/ServingsStepper';
import { Markdown } from '../components/Markdown';
import { useI18n } from '../lib/i18n';

/** Distraction-free view: large text, screen stays on, ingredients can be checked off. */
export function CookingModePage() {
  const id = Number(useParams().id);
  const [params] = useSearchParams();
  const recipe = useRecipe(id);
  const navigate = useNavigate();
  const wake = useWakeLock();
  const { t } = useI18n();
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [servings, setServings] = useState<number | null>(Number(params.get('servings')) || null);

  if (!recipe.data) {
    return <div className="py-20 text-center text-stone-500">{recipe.isError ? t.cook.notOffline : t.common.loading}</div>;
  }
  const r = recipe.data;
  const current = servings ?? r.servings;

  const toggle = (iid: number) =>
    setChecked((cur) => {
      const next = new Set(cur);
      if (next.has(iid)) next.delete(iid);
      else next.add(iid);
      return next;
    });

  return (
    <div className="cooking min-h-dvh bg-cream-50 dark:bg-cocoa-950">
      <header className="pt-safe sticky top-0 z-10 border-b border-stone-900/5 bg-cream-50/90 backdrop-blur dark:border-white/5 dark:bg-cocoa-950/90">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <h1 className="flex-1 truncate font-display text-2xl font-semibold md:text-3xl">{r.title}</h1>
          <span
            className={`hidden items-center gap-1 rounded-full px-3 py-1 text-sm font-medium sm:inline-flex ${
              wake.active
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'bg-stone-200 text-stone-600 dark:bg-white/10 dark:text-stone-300'
            }`}
            title={wake.supported ? undefined : t.cook.unsupportedTitle}
          >
            {wake.active ? <Sun size={16} /> : <SunDim size={16} />}
            {wake.active ? t.cook.awake : wake.supported ? t.cook.mayTurnOff : t.cook.unsupported}
          </span>
          <button className="btn-secondary px-3 py-2 text-lg" onClick={() => navigate(`/recipes/${id}`, { replace: true })}>
            <X size={22} /> {t.cook.exit}
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-6 pb-safe lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-3xl font-semibold">{t.detail.ingredients}</h2>
            <ServingsStepper value={current} onChange={setServings} large />
          </div>
          <IngredientList groups={r.ingredientGroups} factor={current / r.servings} checked={checked} onToggle={toggle} large />
          {checked.size > 0 && (
            <button className="btn-ghost mt-3" onClick={() => setChecked(new Set())}>
              {t.cook.uncheckAll}
            </button>
          )}
        </section>
        <section>
          <h2 className="mb-3 font-display text-3xl font-semibold">{t.detail.instructions}</h2>
          <Markdown text={r.instructions} />
          <div className="h-16" />
        </section>
      </div>
    </div>
  );
}
