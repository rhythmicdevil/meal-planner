import type { MealPlanItemType } from '../api/types'

export interface MealPlanItemRow {
  itemType: MealPlanItemType
  recipeId: string | null
  menuId: string | null
  stapleGroupId: string | null
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
  stapleGroupId: null,
})

export const emptyMealPlanFormValues: MealPlanFormValues = {
  name: '',
  startDate: '',
  endDate: '',
  items: [],
}
