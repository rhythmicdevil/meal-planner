import type { IngredientCategory } from '../api/types'

export interface IngredientFormValues {
  name: string
  category: IngredientCategory | null
  defaultUnit: string
  aliases: string[]
  storeIds: string[]
}

export const emptyIngredientFormValues: IngredientFormValues = {
  name: '',
  category: null,
  defaultUnit: '',
  aliases: [],
  storeIds: [],
}
