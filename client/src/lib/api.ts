import type {
  CatalogEntry,
  Category,
  Recipe,
  RecipeFilters,
  RecipeInput,
  RecipeSummary,
  ShoppingItem,
  ShoppingList,
  TagCount,
} from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json', ...init.headers } : init.headers,
    });
  } catch {
    throw new ApiError('You seem to be offline. This needs a connection.', 0);
  }
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.issues?.length ? `${body.error}: ${body.issues[0].message}` : body.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const json = (body: unknown) => JSON.stringify(body);

export function imageUrl(path: string | null | undefined) {
  return path ? `/api/images/${path}` : null;
}

export function filtersToParams(f: RecipeFilters) {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.tags?.length) p.set('tags', f.tags.join(','));
  if (f.minRating) p.set('minRating', String(f.minRating));
  if (f.ingredient) p.set('ingredient', f.ingredient);
  if (f.sort && f.sort !== 'recent') p.set('sort', f.sort);
  return p;
}

export const api = {
  listRecipes: (f: RecipeFilters) => {
    const qs = filtersToParams(f).toString();
    return request<RecipeSummary[]>(`/recipes${qs ? `?${qs}` : ''}`);
  },
  getRecipe: (id: number) => request<Recipe>(`/recipes/${id}`),
  createRecipe: (input: RecipeInput) => request<Recipe>('/recipes', { method: 'POST', body: json(input) }),
  updateRecipe: (id: number, input: RecipeInput) =>
    request<Recipe>(`/recipes/${id}`, { method: 'PUT', body: json(input) }),
  deleteRecipe: (id: number) => request<void>(`/recipes/${id}`, { method: 'DELETE' }),
  setRating: (id: number, rating: number | null) =>
    request<{ id: number; rating: number | null }>(`/recipes/${id}/rating`, { method: 'PATCH', body: json({ rating }) }),

  uploadImage: (file: Blob) => {
    const form = new FormData();
    form.append('image', file);
    return request<{ imagePath: string }>('/uploads', { method: 'POST', body: form });
  },

  tags: () => request<TagCount[]>('/tags'),
  catalog: () => request<CatalogEntry[]>('/catalog'),
  updateCatalog: (id: number, patch: { name?: string; category?: Category }) =>
    request<CatalogEntry>(`/catalog/${id}`, { method: 'PATCH', body: json(patch) }),
  deleteCatalog: (id: number) => request<void>(`/catalog/${id}`, { method: 'DELETE' }),

  shoppingList: () => request<ShoppingList>('/shopping-list'),
  generateShoppingList: (recipes: { id: number; servings: number }[]) =>
    request<ShoppingList>('/shopping-list/generate', { method: 'POST', body: json({ recipes }) }),
  addShoppingItem: (item: { name: string; amount?: number | null; unit?: string | null }) =>
    request<ShoppingItem>('/shopping-list/items', { method: 'POST', body: json(item) }),
  updateShoppingItem: (id: number, patch: Partial<Pick<ShoppingItem, 'checked' | 'name' | 'amount' | 'unit'>>) =>
    request<ShoppingItem>(`/shopping-list/items/${id}`, { method: 'PATCH', body: json(patch) }),
  deleteShoppingItem: (id: number) => request<void>(`/shopping-list/items/${id}`, { method: 'DELETE' }),
  clearChecked: () => request<ShoppingList>('/shopping-list/clear-checked', { method: 'POST' }),
  clearShoppingList: () => request<ShoppingList>('/shopping-list', { method: 'DELETE' }),

  importBackup: (file: File, keepDuplicates: boolean) =>
    request<{ imported: number; skipped: number }>(`/backup/import${keepDuplicates ? '?duplicates=keep' : ''}`, {
      method: 'POST',
      body: file,
      headers: { 'Content-Type': 'application/json' },
    }),
};
