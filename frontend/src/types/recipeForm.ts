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
}

export interface RecipeFormValues {
  name: string
  sourceUrl: string
  servings: number | ''
  tags: string[]
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
})

export const emptyRecipeFormValues: RecipeFormValues = {
  name: '',
  sourceUrl: '',
  servings: '',
  tags: [],
  steps: [],
  ingredients: [],
}
