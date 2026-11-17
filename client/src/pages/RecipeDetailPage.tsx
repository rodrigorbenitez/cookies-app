import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChefHat, Clock, Pencil, ShoppingBasket, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { useRecipe, useSetRating } from '../lib/useRecipe';
import { StarRating } from '../components/StarRating';
import { RecipeImage } from '../components/RecipeImage';
import { IngredientList } from '../components/IngredientList';
import { ServingsStepper } from '../components/ServingsStepper';
import { Markdown } from '../components/Markdown';
import { useToast } from '../components/Toast';
import { formatTime } from '../lib/format';
import { useSelection } from '../lib/selection';
import { useI18n } from '../lib/i18n';

export function RecipeDetailPage() {
  const id = Number(useParams().id);
  const recipe = useRecipe(id);
  const rate = useSetRating(id);
  const [servings, setServings] = useState<number | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const selection = useSelection();
  const { t, lang, tError } = useI18n();

  const remove = useMutation({
    mutationFn: () => api.deleteRecipe(id),
    onSuccess: () => {
      qc.removeQueries({ queryKey: ['recipe', id] });
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: ['tags'] });
      toast(t.detail.deleted);
      navigate('/');
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  if (recipe.isPending) return <div className="py-20 text-center text-stone-500">{t.common.loading}</div>;
  if (recipe.isError)
    return (
      <div className="py-20 text-center text-stone-500">
        {tError((recipe.error as Error).message)}
        <div className="mt-4">
          <Link to="/" className="btn-secondary">
            {t.detail.backToRecipes}
          </Link>
        </div>
      </div>
    );

  const r = recipe.data;
  const current = servings ?? r.servings;
  const factor = current / r.servings;
  const time = formatTime(r.prepTime, lang);

  return (
    <article className="mx-auto max-w-4xl">
      <div className="mb-3 flex items-center gap-1">
        <button className="icon-btn -ml-2" onClick={() => (history.length > 1 ? navigate(-1) : navigate('/'))} aria-label={t.common.back}>
          <ArrowLeft size={20} />
        </button>
        <div className="ml-auto flex gap-1">
          <button
            className="icon-btn"
            title={t.detail.addToList}
            aria-label={t.detail.addToList}
            onClick={() => {
              if (!selection.isSelected(r.id)) selection.toggle({ id: r.id, title: r.title, servings: current });
              selection.setActive(true);
              navigate('/');
            }}
          >
            <ShoppingBasket size={20} />
          </button>
          <Link to={`/recipes/${id}/edit`} className="icon-btn" aria-label={t.detail.editAria} title={t.detail.edit}>
            <Pencil size={20} />
          </Link>
          <button
            className="icon-btn hover:text-red-600"
            aria-label={t.detail.deleteAria}
            title={t.detail.delete}
            onClick={() => confirm(t.detail.confirmDelete(r.title)) && remove.mutate()}
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl shadow-sm">
        <RecipeImage path={r.imagePath} id={r.id} className="aspect-[16/10] w-full md:aspect-[2/1]" />
      </div>

      <header className="mt-5">
        <h1 className="font-display text-3xl leading-tight font-semibold text-stone-900 md:text-4xl dark:text-stone-50">{r.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <StarRating value={r.rating} onChange={(v) => rate.mutate(v)} size={24} className="-ml-1" />
          {time && (
            <span className="inline-flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
              <Clock size={16} /> {time}
            </span>
          )}
        </div>
        {r.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {r.tags.map((t) => (
              <Link key={t} to={`/?tags=${encodeURIComponent(t)}`} className="chip hover:bg-amber-200 dark:hover:bg-amber-500/25">
                #{t}
              </Link>
            ))}
          </div>
        )}
      </header>

      <Link to={`/recipes/${id}/cook${current !== r.servings ? `?servings=${current}` : ''}`} className="btn-primary mt-5 w-full py-3 text-lg md:w-auto">
        <ChefHat size={22} /> {t.detail.startCooking}
      </Link>

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <section className="card h-fit p-4 md:sticky md:top-20">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">{t.detail.ingredients}</h2>
            <ServingsStepper value={current} onChange={setServings} />
          </div>
          {r.ingredientGroups.some((g) => g.ingredients.length) ? (
            <IngredientList groups={r.ingredientGroups} factor={factor} />
          ) : (
            <p className="text-stone-500">{t.detail.noIngredients}</p>
          )}
        </section>
        <section>
          <h2 className="mb-2 font-display text-xl font-semibold">{t.detail.instructions}</h2>
          {r.instructions.trim() ? <Markdown text={r.instructions} /> : <p className="text-stone-500">{t.detail.noInstructions}</p>}
        </section>
      </div>
    </article>
  );
}
