import type { MealPlanItemType } from '../api/types'

export interface MealPlanItemRow {
  itemType: MealPlanItemType
  recipeId: string | null
  menuId: string | null
}

export interface MealPlanFormValues {
  name: string
  startDate: string
  endDate: string
  items: MealPlanItemRow[]
}

export const emptyMealPlanItemRow = (): MealPlanItemRow => ({
  itemType: 'RECIPE',
  recipeId: null,
  menuId: null,
})

export const emptyMealPlanFormValues: MealPlanFormValues = {
  name: '',
  startDate: '',
  endDate: '',
  items: [],
}
