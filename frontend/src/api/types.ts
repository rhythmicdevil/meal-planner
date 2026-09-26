export type IngredientCategory =
  | 'PRODUCE'
  | 'BAKERY'
  | 'DELI_AND_PREPARED_FOODS'
  | 'MEAT_AND_SEAFOOD'
  | 'DAIRY'
  | 'BREAKFAST_AND_CEREAL'
  | 'BAKING_AND_SPICES'
  | 'CANNED_GOODS_AND_SOUP'
  | 'PASTA_RICE_AND_SAUCES'
  | 'CONDIMENTS_AND_DRESSINGS'
  | 'SNACKS'
  | 'BEVERAGES'
  | 'INTERNATIONAL_ETHNIC'
  | 'FROZEN_FOODS'
  | 'HOUSEHOLD_AND_CLEANING'
  | 'PERSONAL_CARE_AND_HEALTH'
  | 'PET_AND_BABY'
  | 'OTHER'

// Grocery-store walking order -- the backend sorts shopping list items this same way.
export const INGREDIENT_CATEGORIES: IngredientCategory[] = [
  'PRODUCE',
  'BAKERY',
  'DELI_AND_PREPARED_FOODS',
  'MEAT_AND_SEAFOOD',
  'DAIRY',
  'BREAKFAST_AND_CEREAL',
  'BAKING_AND_SPICES',
  'CANNED_GOODS_AND_SOUP',
  'PASTA_RICE_AND_SAUCES',
  'CONDIMENTS_AND_DRESSINGS',
  'SNACKS',
  'BEVERAGES',
  'INTERNATIONAL_ETHNIC',
  'FROZEN_FOODS',
  'HOUSEHOLD_AND_CLEANING',
  'PERSONAL_CARE_AND_HEALTH',
  'PET_AND_BABY',
  'OTHER',
]

export const INGREDIENT_CATEGORY_LABELS: Record<IngredientCategory, string> = {
  PRODUCE: 'Produce',
  BAKERY: 'Bakery',
  DELI_AND_PREPARED_FOODS: 'Deli & Prepared Foods',
  MEAT_AND_SEAFOOD: 'Meat & Seafood',
  DAIRY: 'Dairy',
  BREAKFAST_AND_CEREAL: 'Breakfast & Cereal',
  BAKING_AND_SPICES: 'Baking & Spices',
  CANNED_GOODS_AND_SOUP: 'Canned Goods & Soup',
  PASTA_RICE_AND_SAUCES: 'Pasta, Rice & Sauces',
  CONDIMENTS_AND_DRESSINGS: 'Condiments & Dressings',
  SNACKS: 'Snacks',
  BEVERAGES: 'Beverages',
  INTERNATIONAL_ETHNIC: 'International / Ethnic',
  FROZEN_FOODS: 'Frozen Foods',
  HOUSEHOLD_AND_CLEANING: 'Household & Cleaning',
  PERSONAL_CARE_AND_HEALTH: 'Personal Care & Health',
  PET_AND_BABY: 'Pet & Baby',
  OTHER: 'Other',
}

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

export interface Store {
  id: number
  name: string
}

export interface StoreRequest {
  name: string
}

export type TagType = 'CUISINE' | 'DESCRIPTIVE'

export const TAG_TYPES: TagType[] = ['CUISINE', 'DESCRIPTIVE']

export const TAG_TYPE_LABELS: Record<TagType, string> = {
  CUISINE: 'Cuisine',
  DESCRIPTIVE: 'Descriptive',
}

export interface Tag {
  id: number
  name: string
  type: TagType
}

export interface TagRequest {
  name: string
  type: TagType
}

export interface Ingredient {
  id: number
  name: string
  aliases: string[]
  defaultUnit: string | null
  category: IngredientCategory
  stores: Store[]
}

export interface IngredientRequest {
  name: string
  aliases?: string[]
  defaultUnit?: string | null
  category: IngredientCategory
  storeIds?: number[]
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
  cuisineTag: Tag | null
  descriptiveTags: Tag[]
}

export interface RecipeRequest {
  name: string
  sourceUrl?: string | null
  servings?: number | null
  steps: RecipeStep[]
  ingredients: RecipeIngredientRequest[]
  cuisineTagId?: number | null
  descriptiveTagIds?: number[]
}

export interface ImportedRecipe {
  name: string
  sourceUrl: string
  servings: number | null
  ingredientLines: string[]
  instructionLines: string[]
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

export interface StapleItem {
  id: number
  name: string
  ingredientId: number | null
  ingredientName: string | null
  stores: Store[]
  quantity: number
}

export interface StapleItemRequest {
  name: string
  ingredientId?: number | null
  storeIds?: number[]
  quantity?: number | null
}

export interface StapleGroup {
  id: number
  name: string
  items: StapleItem[]
}

export interface StapleGroupRequest {
  name: string
  items: StapleItemRequest[]
}

export type MealPlanItemType = 'RECIPE' | 'MENU' | 'STAPLE_GROUP'

export interface MealPlanItem {
  id: number
  itemType: MealPlanItemType
  recipe: RecipeSummary | null
  menu: Menu | null
  stapleGroup: StapleGroup | null
}

export interface MealPlanItemRequest {
  itemType: MealPlanItemType
  recipeId: number | null
  menuId: number | null
  stapleGroupId: number | null
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

export interface ShoppingListItem {
  ingredientId: number
  ingredientName: string
  category: IngredientCategory
  totalAmount: number | null
  unit: string | null
  toTaste: boolean
  sourceRecipes: RecipeSummary[]
  stapleGroupName: string | null
}

export interface ShoppingListStapleItem {
  stapleItemId: number
  name: string
  stapleGroupName: string
  quantity: number
}

export interface ShoppingList {
  mealPlanId: number
  items: ShoppingListItem[]
  stapleItems: ShoppingListStapleItem[]
}

export interface PrepListItem {
  ingredientId: number
  ingredientName: string
  amount: number | null
  unit: string | null
  cutType: CutType
  cutTypeOther: string | null
  stateCondition: StateCondition | null
  stateConditionOther: string | null
  toTaste: boolean
  sourceRecipes: RecipeSummary[]
}

export interface PrepList {
  mealPlanId: number
  items: PrepListItem[]
}

export interface ApiError {
  message: string
  fieldErrors?: Record<string, string> | null
}
