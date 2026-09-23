import { describe, expect, it } from 'vitest'
import type { Menu } from '../api/types'
import type { MealPlanItemRow } from '../types/mealPlanForm'
import { resolveMealPlanRecipeIds } from './resolveMealPlanRecipeIds'

const menus: Menu[] = [
  {
    id: 1,
    name: 'Taco Night',
    recipes: [
      { id: 10, name: 'Tacos', servings: 4 },
      { id: 11, name: 'Rice', servings: 4 },
    ],
  },
  { id: 2, name: 'Empty Menu', recipes: [] },
]

const recipeRow = (recipeId: number): MealPlanItemRow => ({
  itemType: 'RECIPE',
  recipeId: String(recipeId),
  menuId: null,
})

const menuRow = (menuId: number): MealPlanItemRow => ({
  itemType: 'MENU',
  recipeId: null,
  menuId: String(menuId),
})

describe('resolveMealPlanRecipeIds', () => {
  it('returns an empty list for no items', () => {
    expect(resolveMealPlanRecipeIds([], menus)).toEqual([])
  })

  it('includes a directly-added recipe item', () => {
    expect(resolveMealPlanRecipeIds([recipeRow(5)], menus)).toEqual([5])
  })

  it('expands a menu item into every recipe it contains', () => {
    expect(resolveMealPlanRecipeIds([menuRow(1)], menus).sort()).toEqual([10, 11])
  })

  it('dedupes a recipe that appears both directly and via a menu', () => {
    expect(resolveMealPlanRecipeIds([recipeRow(10), menuRow(1)], menus).sort()).toEqual([10, 11])
  })

  it('ignores an incomplete row (no recipeId/menuId selected yet)', () => {
    expect(resolveMealPlanRecipeIds([{ itemType: 'RECIPE', recipeId: null, menuId: null }], menus)).toEqual([])
  })

  it('ignores a menu item referencing an unknown or empty menu', () => {
    expect(resolveMealPlanRecipeIds([menuRow(2)], menus)).toEqual([])
    expect(resolveMealPlanRecipeIds([menuRow(999)], menus)).toEqual([])
  })
})
