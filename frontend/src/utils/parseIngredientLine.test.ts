import { describe, expect, it } from 'vitest'
import type { Ingredient } from '../api/types'
import { parseIngredientLine } from './parseIngredientLine'

const catalog: Ingredient[] = [
  { id: 1, name: 'cherry tomatoes', aliases: ['cherry tomato'], defaultUnit: null, category: 'PRODUCE' },
  { id: 2, name: 'olive oil', aliases: [], defaultUnit: null, category: 'CONDIMENTS_AND_DRESSINGS' },
  { id: 3, name: 'salt', aliases: ['kosher salt'], defaultUnit: null, category: 'BAKING_AND_SPICES' },
  { id: 4, name: 'black pepper', aliases: ['pepper'], defaultUnit: null, category: 'BAKING_AND_SPICES' },
]

describe('parseIngredientLine', () => {
  it('parses a plain amount + known unit + name', () => {
    expect(parseIngredientLine('4 cups cherry tomatoes', [])).toMatchObject([
      { amount: 4, unit: 'cups', name: 'cherry tomatoes', notes: '' },
    ])
  })

  it('parses a unicode fraction amount', () => {
    expect(parseIngredientLine('½ teaspoon ground black pepper', [])).toMatchObject([
      { amount: 0.5, unit: 'teaspoon', name: 'ground black pepper', notes: '' },
    ])
  })

  it('strips a leading size descriptor from the name and reads a comma-suffixed cut type', () => {
    expect(parseIngredientLine('1 large onion, diced', [])).toMatchObject([
      { amount: 1, unit: '', name: 'onion', cutType: 'DICED', notes: 'large' },
    ])
  })

  it('reads a modifier + cut-type prefix off the name', () => {
    expect(parseIngredientLine('¼ cup finely sliced fresh basil', [])).toMatchObject([
      { amount: 0.25, unit: 'cup', name: 'fresh basil', cutType: 'SLICED', notes: 'finely' },
    ])
  })

  it('reads a comma-suffixed cut type with no leftover modifier', () => {
    expect(parseIngredientLine('2 cloves garlic, minced', [])).toMatchObject([
      { amount: 2, unit: 'cloves', name: 'garlic', cutType: 'MINCED', notes: '' },
    ])
  })

  it('leaves cutType null and notes untouched when the comma clause is not a cut type', () => {
    expect(parseIngredientLine('1 onion, for garnish', [])).toMatchObject([
      { amount: 1, unit: '', name: 'onion', cutType: null, notes: 'for garnish' },
    ])
  })

  it('takes the upper bound of a word-separated amount range', () => {
    expect(parseIngredientLine('14 to 15 ounces firm tofu', [])).toMatchObject([
      { amount: 15, unit: 'ounces', name: 'firm tofu', notes: '' },
    ])
  })

  it('takes the upper bound of a hyphen-separated amount range', () => {
    expect(parseIngredientLine('2-3 cloves garlic', [])).toMatchObject([
      { amount: 3, unit: 'cloves', name: 'garlic', notes: '' },
    ])
  })

  it('strips chained leading prep-qualifiers ("rinsed and drained canned") into notes', () => {
    expect(parseIngredientLine('1 cup rinsed and drained canned black beans', [])).toMatchObject([
      { amount: 1, unit: 'cup', name: 'black beans', cutType: null, notes: 'rinsed, drained, canned' },
    ])
  })

  it('parses a mixed unicode fraction amount', () => {
    expect(parseIngredientLine('1½ cups arborio rice', [])).toMatchObject([
      { amount: 1.5, unit: 'cups', name: 'arborio rice' },
    ])
  })

  it('parses a plain ASCII-slash fraction amount', () => {
    expect(parseIngredientLine('1/3 cup cream cheese', [])).toMatchObject([
      { amount: 1 / 3, unit: 'cup', name: 'cream cheese' },
    ])
  })

  it('treats a Unicode FRACTION SLASH the same as a plain "/", including a stray space around it', () => {
    // Some sites' extracted ingredient text puts a space around U+2044 ("⁄") where a plain
    // "/" would have none -- e.g. "1 ⁄3 Cup Cream Cheese" instead of "1/3 Cup Cream Cheese".
    expect(parseIngredientLine('1 ⁄3 Cup Cream Cheese', [])).toMatchObject([
      { amount: 1 / 3, unit: 'Cup', name: 'Cream Cheese', notes: '' },
    ])
  })

  it('treats a bare line with no leading amount as the ingredient name, not empty notes', () => {
    expect(parseIngredientLine('a pinch of magic', [])).toMatchObject([
      { amount: null, unit: '', name: 'a pinch of magic', notes: '', matchedIngredientId: null },
    ])
  })

  it('treats a bare ingredient name with no amount/unit the same way', () => {
    expect(parseIngredientLine('salt', [])).toMatchObject([
      { amount: null, unit: '', name: 'salt', notes: '', matchedIngredientId: null },
    ])
    expect(parseIngredientLine('Avocado oil spray', [])).toMatchObject([
      { amount: null, unit: '', name: 'Avocado oil spray', notes: '', matchedIngredientId: null },
    ])
  })

  it('does not split a no-amount line into fake ingredients on plain commas without "and"', () => {
    expect(parseIngredientLine('Cooked rice, for serving, optional', [])).toMatchObject([
      { amount: null, unit: '', name: 'rice', notes: 'Cooked, for serving, optional' },
    ])
  })

  it('matches an existing catalog ingredient by exact name, case-insensitively', () => {
    const [result] = parseIngredientLine('4 cups Cherry Tomatoes', catalog)
    expect(result?.matchedIngredientId).toBe(1)
  })

  it('matches an existing catalog ingredient by alias', () => {
    const [result] = parseIngredientLine('1 cherry tomato', catalog)
    expect(result?.matchedIngredientId).toBe(1)
  })

  it('leaves matchedIngredientId null when nothing in the catalog matches', () => {
    const [result] = parseIngredientLine('4 cups vegetable stock', catalog)
    expect(result?.matchedIngredientId).toBeNull()
  })

  it('strips a trailing parenthetical aside and a leading modifier + cut type from the name', () => {
    const [result] = parseIngredientLine(
      '½ cup freshly grated romano cheese (or vegan equivilent)',
      [],
    )
    expect(result).toMatchObject({
      amount: 0.5,
      unit: 'cup',
      name: 'romano cheese',
      cutType: 'GRATED',
      notes: 'freshly, or vegan equivilent',
    })
  })

  describe('combined ingredients (no single amount to attach to two ingredients)', () => {
    it('splits "X and Y to taste" into two rows sharing a "to taste" note', () => {
      const result = parseIngredientLine('salt and pepper to taste', [])
      expect(result).toMatchObject([
        { amount: null, unit: '', name: 'salt', notes: 'to taste' },
        { amount: null, unit: '', name: 'pepper', notes: 'to taste' },
      ])
    })

    it('splits "X and Y, to taste" (comma before to taste) the same way', () => {
      const result = parseIngredientLine('salt and pepper, to taste', [])
      expect(result).toMatchObject([
        { amount: null, unit: '', name: 'salt', notes: 'to taste' },
        { amount: null, unit: '', name: 'pepper', notes: 'to taste' },
      ])
    })

    it('splits longer descriptive names joined by "and"', () => {
      const result = parseIngredientLine('kosher salt and freshly ground black pepper, to taste', [])
      expect(result.map((r) => r.name)).toEqual(['kosher salt', 'freshly ground black pepper'])
      expect(result.every((r) => r.notes === 'to taste')).toBe(true)
    })

    it('splits an "and"-joined list even without a "to taste" suffix', () => {
      const result = parseIngredientLine('salt and pepper', [])
      expect(result).toMatchObject([
        { amount: null, unit: '', name: 'salt', notes: '' },
        { amount: null, unit: '', name: 'pepper', notes: '' },
      ])
    })

    it('matches each split ingredient against the catalog independently', () => {
      const result = parseIngredientLine('salt and pepper to taste', catalog)
      expect(result[0]?.matchedIngredientId).toBe(3)
      expect(result[1]?.matchedIngredientId).toBe(4)
    })
  })
})
