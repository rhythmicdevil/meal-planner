import type { Menu } from '../api/types'
import type { MealPlanItemRow } from '../types/mealPlanForm'

// Flattens a meal plan's items into the recipe ids they actually cover -- a RECIPE item
// contributes itself, a MENU item contributes every recipe in that menu -- mirroring how
// downstream logic (Shopping List, Prep List) already treats a meal plan as one flat recipe
// list (CLAUDE.md §2: "expand any Menu items into their constituent recipes first").
export function resolveMealPlanRecipeIds(items: MealPlanItemRow[], menus: Menu[]): number[] {
  const ids = new Set<number>()
  for (const item of items) {
    if (item.itemType === 'RECIPE' && item.recipeId) {
      ids.add(Number(item.recipeId))
    } else if (item.itemType === 'MENU' && item.menuId) {
      const menu = menus.find((m) => m.id === Number(item.menuId))
      menu?.recipes.forEach((recipe) => ids.add(recipe.id))
    }
  }
  return [...ids]
}
