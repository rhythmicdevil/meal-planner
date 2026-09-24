import { describe, expect, it } from 'vitest'
import type { Ingredient, Recipe, RecipeIngredient } from '../api/types'
import { findOrphanedIngredients } from './findOrphanedIngredients'

function ingredient(id: number, name: string): Ingredient {
  return { id, name, aliases: [], defaultUnit: null, category: 'OTHER' }
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
    tags: [],
  }
}

describe('findOrphanedIngredients', () => {
  it('flags an ingredient not used by any recipe at all', () => {
    const ingredients = [ingredient(1, 'unused spice')]
    expect(findOrphanedIngredients(ingredients, [])).toEqual(ingredients)
  })

  it('does not flag an ingredient used by at least one recipe', () => {
    const ingredients = [ingredient(1, 'garlic')]
    const recipes = [recipe(10, [1])]
    expect(findOrphanedIngredients(ingredients, recipes)).toEqual([])
  })

  it('only flags the specific ingredients no recipe references', () => {
    const ingredients = [ingredient(1, 'garlic'), ingredient(2, 'unused spice')]
    const recipes = [recipe(10, [1])]
    expect(findOrphanedIngredients(ingredients, recipes)).toEqual([ingredient(2, 'unused spice')])
  })

  it('treats every ingredient as orphaned when there are no recipes at all', () => {
    const ingredients = [ingredient(1, 'garlic'), ingredient(2, 'onion')]
    expect(findOrphanedIngredients(ingredients, [])).toEqual(ingredients)
  })
})
