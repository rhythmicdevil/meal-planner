import { describe, expect, it } from 'vitest'
import type { MealPlan, MealPlanItem } from '../api/types'
import { findRecipeMealPlanAssignments } from './findRecipeMealPlanAssignments'

function recipeItem(id: number, recipeId: number): MealPlanItem {
  return {
    id,
    itemType: 'RECIPE',
    recipe: { id: recipeId, name: `Recipe ${recipeId}`, servings: null },
    menu: null,
    stapleGroup: null,
  }
}

function menuItem(id: number, menuId: number, recipeIds: number[]): MealPlanItem {
  return {
    id,
    itemType: 'MENU',
    recipe: null,
    menu: { id: menuId, name: `Menu ${menuId}`, recipes: recipeIds.map((r) => ({ id: r, name: `Recipe ${r}`, servings: null })) },
    stapleGroup: null,
  }
}

function mealPlan(id: number, items: MealPlanItem[]): MealPlan {
  return { id, name: `Plan ${id}`, startDate: null, endDate: null, items }
}

describe('findRecipeMealPlanAssignments', () => {
  it('finds a direct RECIPE item referencing the recipe', () => {
    const plans = [mealPlan(1, [recipeItem(10, 5)])]
    expect(findRecipeMealPlanAssignments(5, plans)).toEqual([{ mealPlanId: 1, mealPlanName: 'Plan 1', itemId: 10 }])
  })

  it('does not count a recipe only reachable through a menu item', () => {
    const plans = [mealPlan(1, [menuItem(10, 20, [5, 6])])]
    expect(findRecipeMealPlanAssignments(5, plans)).toEqual([])
  })

  it('excludes a meal plan that does not reference the recipe at all', () => {
    const plans = [mealPlan(1, [recipeItem(10, 5)]), mealPlan(2, [recipeItem(11, 6)])]
    expect(findRecipeMealPlanAssignments(5, plans)).toEqual([{ mealPlanId: 1, mealPlanName: 'Plan 1', itemId: 10 }])
  })

  it('returns one assignment per meal plan the recipe is directly in', () => {
    const plans = [mealPlan(1, [recipeItem(10, 5)]), mealPlan(2, [recipeItem(11, 5)])]
    expect(findRecipeMealPlanAssignments(5, plans)).toEqual([
      { mealPlanId: 1, mealPlanName: 'Plan 1', itemId: 10 },
      { mealPlanId: 2, mealPlanName: 'Plan 2', itemId: 11 },
    ])
  })

  it('returns an empty array when no meal plans reference the recipe', () => {
    expect(findRecipeMealPlanAssignments(5, [mealPlan(1, [recipeItem(10, 6)])])).toEqual([])
  })
})
