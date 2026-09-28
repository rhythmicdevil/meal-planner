import type { Ingredient, Recipe, StapleGroup } from '../api/types'

// An ingredient is "orphaned" if nothing actually depends on it: no recipe uses it, and no
// staple item is linked to it either. A staple item's ingredient link is what makes a
// standing grocery item (coffee, bananas, cheerios) show up on the shopping list without a
// recipe ever calling for it -- deleting one out from under a staple item would break that
// link (or fail outright), so it doesn't count as orphaned just because no recipe uses it.
export function findOrphanedIngredients(
  ingredients: Ingredient[],
  recipes: Recipe[],
  stapleGroups: StapleGroup[],
): Ingredient[] {
  const usedIngredientIds = new Set<number>()
  for (const recipe of recipes) {
    for (const ri of recipe.ingredients) {
      usedIngredientIds.add(ri.ingredientId)
    }
  }
  for (const group of stapleGroups) {
    for (const item of group.items) {
      if (item.ingredientId !== null) {
        usedIngredientIds.add(item.ingredientId)
      }
    }
  }

  return ingredients.filter((ingredient) => !usedIngredientIds.has(ingredient.id))
}
