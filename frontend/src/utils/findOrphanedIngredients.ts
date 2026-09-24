import type { Ingredient, Recipe } from '../api/types'

// An ingredient is "orphaned" if no recipe uses it at all.
export function findOrphanedIngredients(ingredients: Ingredient[], recipes: Recipe[]): Ingredient[] {
  const usedIngredientIds = new Set<number>()
  for (const recipe of recipes) {
    for (const ri of recipe.ingredients) {
      usedIngredientIds.add(ri.ingredientId)
    }
  }

  return ingredients.filter((ingredient) => !usedIngredientIds.has(ingredient.id))
}
