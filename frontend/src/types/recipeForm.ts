import type { CutType, StateCondition } from '../api/types'

// Every row here is always fully resolved to a real catalog ingredient -- rows the paste
// parser can't match (and can't auto-create) are surfaced in a notification and never added,
// rather than kept around half-filled-in for a per-row form to fix (there is none anymore;
// see RecipeIngredientsEditor).
export interface RecipeIngredientRow {
  ingredientId: number
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
  // Plain tag names, exactly like the old freeform tags field -- resolved against the tag
  // catalog (creating any that don't exist yet) only at submit time. Both fields are
  // unlimited -- a recipe can have more than one cuisine (e.g. "Tex-Mex" + "American").
  cuisineTagNames: string[]
  descriptiveTagNames: string[]
  steps: string[]
  ingredients: RecipeIngredientRow[]
}

export const emptyRecipeFormValues: RecipeFormValues = {
  name: '',
  sourceUrl: '',
  servings: '',
  cuisineTagNames: [],
  descriptiveTagNames: [],
  steps: [],
  ingredients: [],
}
