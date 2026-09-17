import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { Ingredient, IngredientRequest } from './types'

const INGREDIENTS_KEY = ['ingredients']
const ingredientKey = (id: number | string) => ['ingredients', String(id)]

export function useIngredients() {
  return useQuery({
    queryKey: INGREDIENTS_KEY,
    queryFn: () => apiFetch<Ingredient[]>('/api/ingredients'),
  })
}

export function useIngredient(id: number | string | undefined) {
  return useQuery({
    queryKey: ingredientKey(id ?? ''),
    queryFn: () => apiFetch<Ingredient>(`/api/ingredients/${id}`),
    enabled: id !== undefined,
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

export function useUpdateIngredient(id: number | string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: IngredientRequest) =>
      apiFetch<Ingredient>(`/api/ingredients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGREDIENTS_KEY })
      queryClient.invalidateQueries({ queryKey: ingredientKey(id) })
    },
  })
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) => apiFetch<void>(`/api/ingredients/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGREDIENTS_KEY })
    },
  })
}
