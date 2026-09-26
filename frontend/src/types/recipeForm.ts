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
  // Plain tag names, exactly like the old freeform tags field -- resolved against the tag
  // catalog (creating any that don't exist yet) only at submit time. cuisineTagNames is
  // capped to one entry (TagsInput maxTags={1}).
  cuisineTagNames: string[]
  descriptiveTagNames: string[]
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
  cuisineTagNames: [],
  descriptiveTagNames: [],
  steps: [],
  ingredients: [],
}
