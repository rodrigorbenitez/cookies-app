import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type { Recipe } from './types';

export function useRecipe(id: number) {
  return useQuery({ queryKey: ['recipe', id], queryFn: () => api.getRecipe(id), enabled: Number.isFinite(id) });
}

/** Optimistic rating update, shared by the detail view. */
export function useSetRating(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rating: number | null) => api.setRating(id, rating),
    onMutate: async (rating) => {
      const prev = qc.getQueryData<Recipe>(['recipe', id]);
      if (prev) qc.setQueryData(['recipe', id], { ...prev, rating });
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(['recipe', id], ctx.prev),
    onSettled: () => qc.invalidateQueries({ queryKey: ['recipes'] }),
  });
}
