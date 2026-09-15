import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { Recipe, RecipeRequest } from './types'

const RECIPES_KEY = ['recipes']
const recipeKey = (id: number | string) => ['recipes', String(id)]

export function useRecipes() {
  return useQuery({
    queryKey: RECIPES_KEY,
    queryFn: () => apiFetch<Recipe[]>('/api/recipes'),
  })
}

export function useRecipe(id: number | string | undefined) {
  return useQuery({
    queryKey: recipeKey(id ?? ''),
    queryFn: () => apiFetch<Recipe>(`/api/recipes/${id}`),
    enabled: id !== undefined,
  })
}

export function useCreateRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: RecipeRequest) =>
      apiFetch<Recipe>('/api/recipes', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPES_KEY })
    },
  })
}

export function useUpdateRecipe(id: number | string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: RecipeRequest) =>
      apiFetch<Recipe>(`/api/recipes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPES_KEY })
      queryClient.invalidateQueries({ queryKey: recipeKey(id) })
    },
  })
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) =>
      apiFetch<void>(`/api/recipes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPES_KEY })
    },
  })
}
