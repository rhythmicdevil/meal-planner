import type { Recipe } from '../api/types'

export interface RecipeSuggestion {
  recipe: Recipe
  matchCount: number
  matchedIngredientNames: string[]
}

// Suggests other recipes worth adding to a menu/meal-plan-in-progress, ranked by how many
// distinct ingredients they share with the recipes already selected -- fewer distinct
// ingredients to buy, less produce wasted, simpler prep. Matching is on ingredientId only:
// cutType, stateCondition, notes, amount, and unit never factor in, since a recipe that
// minces garlic and one that doesn't still both just need "garlic." Capped to the top
// maxResults so the panel stays a short, scannable list rather than the whole catalog.
export function suggestRecipes(selectedRecipeIds: number[], allRecipes: Recipe[], maxResults = 6): RecipeSuggestion[] {
  const selectedIdSet = new Set(selectedRecipeIds)
  const menuIngredientIds = new Set<number>()
  for (const recipe of allRecipes) {
    if (!selectedIdSet.has(recipe.id)) continue
    for (const ri of recipe.ingredients) menuIngredientIds.add(ri.ingredientId)
  }
  if (menuIngredientIds.size === 0) return []

  const suggestions: RecipeSuggestion[] = []
  for (const recipe of allRecipes) {
    if (selectedIdSet.has(recipe.id)) continue
    // A Map keyed by ingredientId dedupes a repeated ingredient across multiple rows of the
    // same candidate recipe (e.g. "olive oil, divided" appearing twice) down to one match.
    const matched = new Map<number, string>()
    for (const ri of recipe.ingredients) {
      if (menuIngredientIds.has(ri.ingredientId)) matched.set(ri.ingredientId, ri.ingredientName)
    }
    if (matched.size === 0) continue
    suggestions.push({
      recipe,
      matchCount: matched.size,
      matchedIngredientNames: [...matched.values()].sort((a, b) => a.localeCompare(b)),
    })
  }

  suggestions.sort((a, b) => b.matchCount - a.matchCount || a.recipe.name.localeCompare(b.recipe.name))
  return suggestions.slice(0, maxResults)
}
