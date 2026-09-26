import type { CutType, StateCondition } from '../api/types'

export interface RecipeIngredientRow {
  ingredientId: number | null
  amount: number | ''
  unit: string
  cutType: CutType | null
  cutTypeOther: string
  stateCondition: StateCondition | null
  stateConditionOther: string
  notes: string
  // UI-only, never sent to the backend -- whether this row shows its full editor form or
  // the compact "amount unit, ingredient, cut type, state condition, notes" summary line.
  isEditing: boolean
}

export interface RecipeFormValues {
  name: string
  sourceUrl: string
  servings: number | ''
  cuisineTagId: string | null
  descriptiveTagIds: string[]
  steps: string[]
  ingredients: RecipeIngredientRow[]
}

export const emptyIngredientRow = (): RecipeIngredientRow => ({
  ingredientId: null,
  amount: '',
  unit: '',
  cutType: null,
  cutTypeOther: '',
  stateCondition: null,
  stateConditionOther: '',
  notes: '',
  isEditing: true,
})

export const emptyRecipeFormValues: RecipeFormValues = {
  name: '',
  sourceUrl: '',
  servings: '',
  cuisineTagId: null,
  descriptiveTagIds: [],
  steps: [],
  ingredients: [],
}
