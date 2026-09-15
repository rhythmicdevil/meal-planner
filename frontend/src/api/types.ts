export type IngredientCategory = 'PRODUCE' | 'DAIRY' | 'PANTRY' | 'PROTEIN' | 'SPICE' | 'OTHER'

export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  'PRODUCE',
  'DAIRY',
  'PANTRY',
  'PROTEIN',
  'SPICE',
  'OTHER',
]

export type CutType =
  | 'CHOPPED'
  | 'DICED'
  | 'MINCED'
  | 'JULIENNED'
  | 'SLICED'
  | 'SHREDDED'
  | 'GRATED'
  | 'WHOLE'
  | 'OTHER'

export const CUT_TYPES: CutType[] = [
  'CHOPPED',
  'DICED',
  'MINCED',
  'JULIENNED',
  'SLICED',
  'SHREDDED',
  'GRATED',
  'WHOLE',
  'OTHER',
]

export type StateCondition =
  | 'RAW'
  | 'COOKED'
  | 'FROZEN'
  | 'THAWED'
  | 'SOFTENED'
  | 'MELTED'
  | 'ROOM_TEMP'
  | 'OTHER'

export const STATE_CONDITIONS: StateCondition[] = [
  'RAW',
  'COOKED',
  'FROZEN',
  'THAWED',
  'SOFTENED',
  'MELTED',
  'ROOM_TEMP',
  'OTHER',
]

export interface Ingredient {
  id: number
  name: string
  aliases: string[]
  defaultUnit: string | null
  category: IngredientCategory
}

export interface IngredientRequest {
  name: string
  aliases?: string[]
  defaultUnit?: string | null
  category: IngredientCategory
}

export interface RecipeStep {
  stepNumber: number
  stepText: string
}

export interface RecipeIngredient {
  id: number
  ingredientId: number
  ingredientName: string
  amount: number | null
  unit: string | null
  cutType: CutType | null
  cutTypeOther: string | null
  stateCondition: StateCondition | null
  stateConditionOther: string | null
  notes: string | null
}

export interface RecipeIngredientRequest {
  ingredientId: number
  amount?: number | null
  unit?: string | null
  cutType?: CutType | null
  cutTypeOther?: string | null
  stateCondition?: StateCondition | null
  stateConditionOther?: string | null
  notes?: string | null
}

export interface Recipe {
  id: number
  name: string
  sourceUrl: string | null
  servings: number | null
  steps: RecipeStep[]
  ingredients: RecipeIngredient[]
  tags: string[]
}

export interface RecipeRequest {
  name: string
  sourceUrl?: string | null
  servings?: number | null
  steps: RecipeStep[]
  ingredients: RecipeIngredientRequest[]
  tags: string[]
}

export interface RecipeSummary {
  id: number
  name: string
  servings: number | null
}

export interface Menu {
  id: number
  name: string
  recipes: RecipeSummary[]
}

export interface MenuRequest {
  name: string
  recipeIds: number[]
}

export type MealPlanItemType = 'RECIPE' | 'MENU'

export interface MealPlanItem {
  id: number
  itemType: MealPlanItemType
  recipe: RecipeSummary | null
  menu: Menu | null
}

export interface MealPlanItemRequest {
  itemType: MealPlanItemType
  recipeId: number | null
  menuId: number | null
}

export interface MealPlan {
  id: number
  name: string
  startDate: string | null
  endDate: string | null
  items: MealPlanItem[]
}

export interface MealPlanRequest {
  name: string
  startDate?: string | null
  endDate?: string | null
  items: MealPlanItemRequest[]
}

export interface ApiError {
  message: string
  fieldErrors?: Record<string, string> | null
}
