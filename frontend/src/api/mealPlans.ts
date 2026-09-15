import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { MealPlan, MealPlanRequest, ShoppingList } from './types'

const MEAL_PLANS_KEY = ['mealPlans']
const mealPlanKey = (id: number | string) => ['mealPlans', String(id)]
const shoppingListKey = (id: number | string) => ['mealPlans', String(id), 'shoppingList']

export function useMealPlans() {
  return useQuery({
    queryKey: MEAL_PLANS_KEY,
    queryFn: () => apiFetch<MealPlan[]>('/api/meal-plans'),
  })
}

export function useMealPlan(id: number | string | undefined) {
  return useQuery({
    queryKey: mealPlanKey(id ?? ''),
    queryFn: () => apiFetch<MealPlan>(`/api/meal-plans/${id}`),
    enabled: id !== undefined,
  })
}

export function useShoppingList(id: number | string | undefined) {
  return useQuery({
    queryKey: shoppingListKey(id ?? ''),
    queryFn: () => apiFetch<ShoppingList>(`/api/meal-plans/${id}/shopping-list`),
    enabled: id !== undefined,
  })
}

export function useCreateMealPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: MealPlanRequest) =>
      apiFetch<MealPlan>('/api/meal-plans', {
        method: 'POST',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLANS_KEY })
    },
  })
}

export function useUpdateMealPlan(id: number | string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: MealPlanRequest) =>
      apiFetch<MealPlan>(`/api/meal-plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(request),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLANS_KEY })
      queryClient.invalidateQueries({ queryKey: mealPlanKey(id) })
    },
  })
}

export function useDeleteMealPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number | string) =>
      apiFetch<void>(`/api/meal-plans/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEAL_PLANS_KEY })
    },
  })
}
