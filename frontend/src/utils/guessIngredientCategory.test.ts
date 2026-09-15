import { describe, expect, it } from 'vitest'
import { guessIngredientCategory } from './guessIngredientCategory'

describe('guessIngredientCategory', () => {
  // exact names auto-created from a real bulk-paste session -- every one of these landed
  // in OTHER before this heuristic existed
  it.each([
    ['cherry tomatoes', 'PRODUCE'],
    ['olive oil', 'CONDIMENTS_AND_DRESSINGS'],
    ['kosher salt', 'BAKING_AND_SPICES'],
    ['ground black pepper', 'BAKING_AND_SPICES'],
    ['onion', 'PRODUCE'],
    ['arborio rice', 'PASTA_RICE_AND_SAUCES'],
    ['dry white wine', 'BEVERAGES'],
    ['vegetable stock', 'CANNED_GOODS_AND_SOUP'],
    ['romano cheese', 'DAIRY'],
    ['salt', 'BAKING_AND_SPICES'],
    ['pepper', 'BAKING_AND_SPICES'],
    ['fresh basil', 'PRODUCE'],
    ['julienne-cut carrots', 'PRODUCE'],
    ['seasoned rice vinegar', 'CONDIMENTS_AND_DRESSINGS'],
    ['ground ginger', 'BAKING_AND_SPICES'],
    ['sweet bell pepper', 'PRODUCE'],
    ['yellow onion', 'PRODUCE'],
    ['halved fresh Brussels sprouts', 'PRODUCE'],
    ['extra virgin olive oil', 'CONDIMENTS_AND_DRESSINGS'],
    ['dry freekeh', 'PASTA_RICE_AND_SAUCES'],
    ['fresh cilantro', 'PRODUCE'],
  ])('categorizes %s as %s', (name, expected) => {
    expect(guessIngredientCategory(name)).toBe(expected)
  })

  it('distinguishes bell pepper (produce) from bare pepper (spice)', () => {
    expect(guessIngredientCategory('red bell pepper')).toBe('PRODUCE')
    expect(guessIngredientCategory('black pepper')).toBe('BAKING_AND_SPICES')
  })

  it('covers categories not represented in the real sample above', () => {
    expect(guessIngredientCategory('boneless chicken thighs')).toBe('MEAT_AND_SEAFOOD')
    expect(guessIngredientCategory('whole milk')).toBe('DAIRY')
    expect(guessIngredientCategory('sourdough bread')).toBe('BAKERY')
    expect(guessIngredientCategory('frozen peas')).toBe('FROZEN_FOODS')
    expect(guessIngredientCategory('orange juice')).toBe('BEVERAGES')
  })

  it('falls back to OTHER for anything unrecognized', () => {
    expect(guessIngredientCategory('xyzzy')).toBe('OTHER')
  })
})
