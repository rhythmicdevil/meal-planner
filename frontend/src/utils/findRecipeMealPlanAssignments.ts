import type { MealPlan } from '../api/types'

export interface RecipeMealPlanAssignment {
  mealPlanId: number
  mealPlanName: string
  itemId: number
}

// Only direct RECIPE items count -- a recipe reached through a Menu item can't be
// unambiguously "removed" from here (that would mean removing the whole Menu, which may carry
// other recipes too), so it's out of scope for the Recipe list's remove/move affordance. This
// intentionally narrower than the full "is this recipe used by this plan at all" question.
//
// Builds the whole recipeId -> assignments index in one pass over every meal plan's items,
// rather than doing that scan separately per recipe -- the Recipe list renders one cell per
// row that each need this, and re-scanning every meal plan's items from scratch for every row
// (findRecipeMealPlanAssignments below did exactly that) is O(rows x plans x items) instead of
// one O(plans x items) pass.
export function groupRecipeMealPlanAssignmentsByRecipe(mealPlans: MealPlan[]): Map<number, RecipeMealPlanAssignment[]> {
  const byRecipe = new Map<number, RecipeMealPlanAssignment[]>()
  for (const mealPlan of mealPlans) {
    for (const item of mealPlan.items) {
      if (item.itemType === 'RECIPE' && item.recipe) {
        const assignment: RecipeMealPlanAssignment = { mealPlanId: mealPlan.id, mealPlanName: mealPlan.name, itemId: item.id }
        const existing = byRecipe.get(item.recipe.id)
        if (existing) {
          existing.push(assignment)
        } else {
          byRecipe.set(item.recipe.id, [assignment])
        }
      }
    }
  }
  return byRecipe
}

// Single-recipe convenience wrapper around groupRecipeMealPlanAssignmentsByRecipe, for the one
// callers (AddToMealPlanButton) that only ever needs one recipe's assignments and don't have a
// whole table of rows to amortize the full index over.
export function findRecipeMealPlanAssignments(recipeId: number, mealPlans: MealPlan[]): RecipeMealPlanAssignment[] {
  return groupRecipeMealPlanAssignmentsByRecipe(mealPlans).get(recipeId) ?? []
}
