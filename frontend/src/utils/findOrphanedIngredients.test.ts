import { describe, expect, it } from 'vitest'
import type { Ingredient, Recipe, RecipeIngredient, StapleGroup, StapleItem } from '../api/types'
import { findOrphanedIngredients } from './findOrphanedIngredients'

function ingredient(id: number, name: string): Ingredient {
  return { id, name, aliases: [], defaultUnit: null, category: 'OTHER', stores: [] }
}

function ri(ingredientId: number): RecipeIngredient {
  return {
    id: ingredientId * 100,
    ingredientId,
    ingredientName: `ingredient ${ingredientId}`,
    amount: 1,
    unit: null,
    cutType: null,
    cutTypeOther: null,
    stateCondition: null,
    stateConditionOther: null,
    notes: null,
  }
}

function recipe(id: number, ingredientIds: number[]): Recipe {
  return {
    id,
    name: `Recipe ${id}`,
    sourceUrl: null,
    servings: null,
    steps: [],
    ingredients: ingredientIds.map(ri),
    cuisineTags: [],
    descriptiveTags: [],
  }
}

function stapleItem(id: number, ingredientId: number | null): StapleItem {
  return {
    id,
    name: `staple item ${id}`,
    ingredientId,
    ingredientName: ingredientId !== null ? `ingredient ${ingredientId}` : null,
    stores: [],
    quantity: 1,
  }
}

function stapleGroup(id: number, items: StapleItem[]): StapleGroup {
  return { id, name: `Staple group ${id}`, items }
}

describe('findOrphanedIngredients', () => {
  it('flags an ingredient not used by any recipe or staple item', () => {
    const ingredients = [ingredient(1, 'unused spice')]
    expect(findOrphanedIngredients(ingredients, [], [])).toEqual(ingredients)
  })

  it('does not flag an ingredient used by at least one recipe', () => {
    const ingredients = [ingredient(1, 'garlic')]
    const recipes = [recipe(10, [1])]
    expect(findOrphanedIngredients(ingredients, recipes, [])).toEqual([])
  })

  it('only flags the specific ingredients no recipe or staple item references', () => {
    const ingredients = [ingredient(1, 'garlic'), ingredient(2, 'unused spice')]
    const recipes = [recipe(10, [1])]
    expect(findOrphanedIngredients(ingredients, recipes, [])).toEqual([ingredient(2, 'unused spice')])
  })

  it('treats every ingredient as orphaned when there are no recipes or staple items at all', () => {
    const ingredients = [ingredient(1, 'garlic'), ingredient(2, 'onion')]
    expect(findOrphanedIngredients(ingredients, [], [])).toEqual(ingredients)
  })

  it('does not flag an ingredient linked to a staple item, even with no recipe using it', () => {
    const ingredients = [ingredient(1, 'bananas')]
    const stapleGroups = [stapleGroup(1, [stapleItem(1, 1)])]
    expect(findOrphanedIngredients(ingredients, [], stapleGroups)).toEqual([])
  })

  it('still flags an ingredient when a staple item in the group is unlinked (household item)', () => {
    const ingredients = [ingredient(1, 'unused spice')]
    const stapleGroups = [stapleGroup(1, [stapleItem(1, null)])]
    expect(findOrphanedIngredients(ingredients, [], stapleGroups)).toEqual(ingredients)
  })
})
