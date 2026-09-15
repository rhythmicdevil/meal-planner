import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { Ingredient, IngredientRequest } from './types'

const INGREDIENTS_KEY = ['ingredients']

export function useIngredients() {
  return useQuery({
    queryKey: INGREDIENTS_KEY,
    queryFn: () => apiFetch<Ingredient[]>('/api/ingredients'),
  })
}

export function useCreateIngredient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: IngredientRequest) =>
      apiFetch<Ingredient>('/api/ingredients', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGREDIENTS_KEY })
    },
  })
}
