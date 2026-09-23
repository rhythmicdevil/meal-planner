import { describe, expect, it } from 'vitest'
import type { Recipe, RecipeIngredient } from '../api/types'
import { suggestRecipes } from './suggestRecipes'

function ri(ingredientId: number, ingredientName: string, cutType: RecipeIngredient['cutType'] = null): RecipeIngredient {
  return {
    id: ingredientId * 100,
    ingredientId,
    ingredientName,
    amount: 1,
    unit: null,
    cutType,
    cutTypeOther: null,
    stateCondition: null,
    stateConditionOther: null,
    notes: null,
  }
}

function recipe(id: number, name: string, ingredients: RecipeIngredient[]): Recipe {
  return { id, name, sourceUrl: null, servings: null, steps: [], ingredients, tags: [] }
}

const garlic = (cutType?: RecipeIngredient['cutType']) => ri(1, 'garlic', cutType)
const oliveOil = () => ri(2, 'olive oil')
const basil = () => ri(3, 'basil')
const salt = () => ri(4, 'salt')

describe('suggestRecipes', () => {
  it('returns nothing when no recipes are selected yet', () => {
    const all = [recipe(1, 'A', [garlic()]), recipe(2, 'B', [garlic()])]
    expect(suggestRecipes([], all)).toEqual([])
  })

  it('returns nothing when the selected recipes share no ingredients with anything else', () => {
    const all = [recipe(1, 'A', [garlic()]), recipe(2, 'B', [salt()])]
    expect(suggestRecipes([1], all)).toEqual([])
  })

  it('ranks a recipe matching more shared ingredients above one matching fewer', () => {
    const all = [
      recipe(1, 'Selected', [garlic(), oliveOil(), basil()]),
      recipe(2, 'Two matches', [garlic(), oliveOil()]),
      recipe(3, 'One match', [garlic()]),
    ]
    const result = suggestRecipes([1], all)
    expect(result.map((s) => s.recipe.name)).toEqual(['Two matches', 'One match'])
    expect(result[0].matchCount).toBe(2)
    expect(result[1].matchCount).toBe(1)
  })

  it('matches on ingredientId only, ignoring cutType/prep differences', () => {
    const all = [recipe(1, 'Selected', [garlic('MINCED')]), recipe(2, 'Candidate', [garlic(null)])]
    const result = suggestRecipes([1], all)
    expect(result).toHaveLength(1)
    expect(result[0].matchCount).toBe(1)
  })

  it('never suggests a recipe that is already selected', () => {
    const all = [recipe(1, 'Selected', [garlic()]), recipe(2, 'Also selected', [garlic()])]
    expect(suggestRecipes([1, 2], all)).toEqual([])
  })

  it('counts a repeated ingredient within one candidate recipe only once', () => {
    const all = [
      recipe(1, 'Selected', [oliveOil()]),
      recipe(2, 'Candidate', [oliveOil(), { ...oliveOil(), id: 999, notes: 'divided' }]),
    ]
    const result = suggestRecipes([1], all)
    expect(result).toHaveLength(1)
    expect(result[0].matchCount).toBe(1)
    expect(result[0].matchedIngredientNames).toEqual(['olive oil'])
  })

  it('unions ingredients across every selected recipe, not just one', () => {
    const all = [
      recipe(1, 'Selected A', [garlic()]),
      recipe(2, 'Selected B', [basil()]),
      recipe(3, 'Candidate', [garlic(), basil()]),
    ]
    const result = suggestRecipes([1, 2], all)
    expect(result).toHaveLength(1)
    expect(result[0].matchCount).toBe(2)
  })

  it('caps results at 6 by default, keeping the highest-ranked ones', () => {
    const selected = recipe(1, 'Selected', [garlic()])
    const candidates = Array.from({ length: 8 }, (_, i) => recipe(i + 2, `Candidate ${i}`, [garlic()]))
    const result = suggestRecipes([1], [selected, ...candidates])
    expect(result).toHaveLength(6)
  })

  it('accepts a custom maxResults', () => {
    const selected = recipe(1, 'Selected', [garlic()])
    const candidates = Array.from({ length: 5 }, (_, i) => recipe(i + 2, `Candidate ${i}`, [garlic()]))
    const result = suggestRecipes([1], [selected, ...candidates], 2)
    expect(result).toHaveLength(2)
  })

  it('breaks a tie in match count alphabetically by recipe name', () => {
    const all = [
      recipe(1, 'Selected', [garlic()]),
      recipe(2, 'Zebra', [garlic()]),
      recipe(3, 'Apple', [garlic()]),
    ]
    const result = suggestRecipes([1], all)
    expect(result.map((s) => s.recipe.name)).toEqual(['Apple', 'Zebra'])
  })
})
