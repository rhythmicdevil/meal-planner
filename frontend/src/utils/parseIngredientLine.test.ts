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
    expect(parseIngredientLine('½ teaspoon salt', [])).toMatchObject([
      { amount: 0.5, unit: 'teaspoon', name: 'salt', notes: '' },
    ])
  })

  it('strips a leading size descriptor from the name and reads a comma-suffixed cut type', () => {
    expect(parseIngredientLine('1 large onion, diced', [])).toMatchObject([
      { amount: 1, unit: '', name: 'onion', cutType: 'DICED', notes: 'large' },
    ])
  })

  it('strips an intensifier + size descriptor ("very small") off the name as one note phrase', () => {
    expect(parseIngredientLine('1/2 very small red onion, finely chopped', [])).toMatchObject([
      { amount: 0.5, unit: '', name: 'red onion', cutType: 'CHOPPED', notes: 'very small, finely' },
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

  it('reads a fused "N-unit package" as the real amount/unit, keeping the container word in notes', () => {
    expect(parseIngredientLine('1 10-oz package fresh cheese tortellini (283 g)', [])).toMatchObject([
      { amount: 10, unit: 'oz', name: 'cheese tortellini', notes: 'package, fresh, 283 g' },
    ])
  })

  it('does the same for a "N-unit can" package size, keeping other trailing notes too', () => {
    expect(parseIngredientLine('1 15-ounce can chickpeas, rinsed', [])).toMatchObject([
      { amount: 15, unit: 'ounce', name: 'chickpeas', notes: 'can, rinsed' },
    ])
  })

  it('leaves a fused "N-unit" token alone when the leading amount is not a bare 1', () => {
    // No real-world example yet of "3 10-oz packages X" -- multiplying it out would be a
    // guess, so this is intentionally left as before (whole thing glued into the name).
    expect(parseIngredientLine('3 10-oz packages tortellini', [])).toMatchObject([
      { amount: 3, unit: '', name: '10-oz packages tortellini' },
    ])
  })

  it('reads a "N unit package" (plain space, not just a hyphen) as the real amount/unit', () => {
    expect(
      parseIngredientLine('1 28 oz can whole tomatoes (drained and chopped, preferably San Marzano)', []),
    ).toMatchObject([
      { amount: 28, unit: 'oz', name: 'tomatoes', cutType: 'WHOLE', notes: 'can, drained and chopped, preferably San Marzano' },
    ])
  })

  it('collapses a redundant double-wrapped trailing parenthetical down to its content', () => {
    expect(parseIngredientLine('8 oz lo mein noodles ((cooked according to package instructions))', [])).toMatchObject(
      [{ amount: 8, unit: 'oz', name: 'lo mein noodles', notes: 'cooked according to package instructions' }],
    )
  })

  it('keeps a genuine nested annotation intact instead of tearing it open', () => {
    expect(parseIngredientLine('4 oz sharp cheddar cheese (shredded (See Note 1))', [])).toMatchObject([
      { amount: 4, unit: 'oz', name: 'sharp cheddar cheese', notes: 'shredded (See Note 1)' },
    ])
  })

  it('splits a leading "each" list into one row per item, sharing the same amount/unit', () => {
    const result = parseIngredientLine('1 tsp each oregano, crushed red pepper flakes, and smoked paprika', [])
    expect(result).toMatchObject([
      { amount: 1, unit: 'tsp', name: 'oregano' },
      { amount: 1, unit: 'tsp', name: 'crushed red pepper flakes' },
      { amount: 1, unit: 'tsp', name: 'smoked paprika' },
    ])
  })

  it('splits a leading "each A and B" list the same way', () => {
    expect(parseIngredientLine('1/2 tsp each salt and pepper', [])).toMatchObject([
      { amount: 0.5, unit: 'tsp', name: 'salt' },
      { amount: 0.5, unit: 'tsp', name: 'pepper' },
    ])
  })

  it('still treats "N each X" as the unit, not the each-list marker, when nothing precedes it', () => {
    expect(parseIngredientLine('2 each onions', [])).toMatchObject([{ amount: 2, unit: 'each', name: 'onions' }])
  })

  it('strips a leading "ground"/"crumbled"/"cracked" qualifier into notes, no cutType', () => {
    expect(parseIngredientLine('1 tsp ground black pepper', [])).toMatchObject([
      { amount: 1, unit: 'tsp', name: 'black pepper', cutType: null, notes: 'ground' },
    ])
    expect(parseIngredientLine('1/2 cup crumbled feta cheese, for serving', [])).toMatchObject([
      { amount: 0.5, unit: 'cup', name: 'feta cheese', cutType: null, notes: 'crumbled, for serving' },
    ])
  })

  it('recognizes "c" as an abbreviation for cup, and "stalk(s)" as a unit', () => {
    expect(parseIngredientLine('1/2 c. flat-leaf parsley, chopped', [])).toMatchObject([
      { amount: 0.5, unit: 'c', name: 'flat-leaf parsley', cutType: 'CHOPPED' },
    ])
    expect(parseIngredientLine('4 stalks celery', [])).toMatchObject([
      { amount: 4, unit: 'stalks', name: 'celery' },
    ])
  })

  it('does not mistake "whole" in a compound noun ("whole wheat"/"whole milk") for a cut type', () => {
    expect(parseIngredientLine('6 whole wheat tortillas', [])).toMatchObject([
      { amount: 6, unit: '', name: 'whole wheat tortillas', cutType: null },
    ])
    expect(parseIngredientLine('1 cup whole milk', [])).toMatchObject([
      { amount: 1, unit: 'cup', name: 'whole milk', cutType: null },
    ])
    // A genuine "whole" cut type (not a compound noun) still works.
    expect(parseIngredientLine('1 28 oz can whole tomatoes', [])).toMatchObject([
      { amount: 28, unit: 'oz', name: 'tomatoes', cutType: 'WHOLE' },
    ])
  })

  it('strips a trailing "for/to garnish|serving|topping..." purpose clause into notes', () => {
    expect(parseIngredientLine('sesame seeds for optional garnish', [])).toMatchObject([
      { amount: null, unit: '', name: 'sesame seeds', notes: 'for optional garnish' },
    ])
    expect(parseIngredientLine('Sesame Seeds to Garnish', [])).toMatchObject([
      { amount: null, unit: '', name: 'Sesame Seeds', notes: 'to Garnish' },
    ])
    expect(parseIngredientLine('2 tbsp parsley for garnish', [])).toMatchObject([
      { amount: 2, unit: 'tbsp', name: 'parsley', notes: 'for garnish' },
    ])
  })

  it('unwraps a comma-split notes clause that is itself fully wrapped in parens', () => {
    expect(parseIngredientLine('4 large stalks celery, (sliced on a bias)', [])).toMatchObject([
      { amount: 4, unit: '', name: 'stalks celery', notes: 'large, sliced on a bias' },
    ])
  })

  it('normalizes the unit to lowercase regardless of source capitalization', () => {
    expect(parseIngredientLine('2 Tbsp unsalted butter', [])).toMatchObject([
      { amount: 2, unit: 'tbsp', name: 'unsalted butter' },
    ])
    expect(parseIngredientLine('1 CUP flour', [])).toMatchObject([{ amount: 1, unit: 'cup', name: 'flour' }])
  })

  it('normalizes the unit to lowercase for a fused package-size line too', () => {
    expect(parseIngredientLine('1 15-OZ can chickpeas', [])).toMatchObject([
      { amount: 15, unit: 'oz', name: 'chickpeas' },
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
      { amount: 1 / 3, unit: 'cup', name: 'Cream Cheese', notes: '' },
    ])
  })

  it('does not split inside a parenthetical aside that happens to contain a comma', () => {
    expect(parseIngredientLine('1/2 cup sun-dried tomatoes (finely diced, packed in oil)', [])).toMatchObject([
      { amount: 0.5, unit: 'cup', name: 'sun-dried tomatoes', notes: 'finely diced, packed in oil' },
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
