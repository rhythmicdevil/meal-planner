import { describe, expect, it } from 'vitest'
import type { Ingredient } from '../api/types'
import { parseIngredientLine } from './parseIngredientLine'
import { serializeIngredientLine, serializeIngredientsToText, type SerializableIngredientRow } from './serializeIngredientLine'

function row(overrides: Partial<SerializableIngredientRow> = {}): SerializableIngredientRow {
  return {
    ingredientName: 'onion',
    amount: 1,
    unit: '',
    cutType: null,
    cutTypeOther: '',
    stateCondition: null,
    stateConditionOther: '',
    notes: '',
    ...overrides,
  }
}

describe('serializeIngredientLine', () => {
  it('formats amount, unit, and name', () => {
    expect(serializeIngredientLine(row({ ingredientName: 'flour', amount: 2, unit: 'cup' }))).toBe('2 cup flour')
  })

  it('omits the amount/unit entirely for a "to taste" row', () => {
    expect(serializeIngredientLine(row({ ingredientName: 'salt', amount: '', notes: 'to taste' }))).toBe(
      'salt, to taste',
    )
  })

  it('prefixes a plain-vocabulary cutType onto the name', () => {
    expect(serializeIngredientLine(row({ amount: 1, cutType: 'DICED' }))).toBe('1 diced onion')
  })

  it('keeps separate notes after a cutType-prefixed name', () => {
    expect(serializeIngredientLine(row({ amount: 1, cutType: 'DICED', notes: 'for salsa' }))).toBe(
      '1 diced onion, for salsa',
    )
  })

  it('folds an OTHER cutType/stateCondition free-text value into notes instead of the name', () => {
    expect(
      serializeIngredientLine(
        row({ amount: 1, cutType: 'OTHER', cutTypeOther: 'spiralized', stateCondition: 'OTHER', stateConditionOther: 'ground' }),
      ),
    ).toBe('1 onion, spiralized, ground')
  })

  it('joins multiple rows with one line each', () => {
    const text = serializeIngredientsToText([
      row({ ingredientName: 'flour', amount: 2, unit: 'cup' }),
      row({ ingredientName: 'salt', amount: '', notes: 'to taste' }),
    ])
    expect(text).toBe('2 cup flour\nsalt, to taste')
  })

  describe('round-trips back through parseIngredientLine', () => {
    it('preserves amount, unit, name, cutType, and notes together', () => {
      const original = row({ ingredientName: 'onion', amount: 2, unit: 'cup', cutType: 'DICED', notes: 'for salsa' })
      const [reparsed] = parseIngredientLine(serializeIngredientLine(original), [])
      expect(reparsed).toMatchObject({ amount: 2, unit: 'cup', name: 'onion', cutType: 'DICED', notes: 'for salsa' })
    })

    it('preserves a "to taste" row with no amount', () => {
      const original = row({ ingredientName: 'salt', amount: '', notes: 'to taste' })
      const [reparsed] = parseIngredientLine(serializeIngredientLine(original), [])
      expect(reparsed).toMatchObject({ amount: null, name: 'salt', notes: 'to taste' })
    })

    it('preserves a unit the parser only recognizes after this refactor\'s KNOWN_UNITS fix (bag)', () => {
      const original = row({ ingredientName: 'quorn bites', amount: 1, unit: 'bag' })
      const [reparsed] = parseIngredientLine(serializeIngredientLine(original), [])
      expect(reparsed).toMatchObject({ amount: 1, unit: 'bag', name: 'quorn bites' })
    })

    it('preserves the abbreviated "pt" unit the parser itself produces', () => {
      const original = row({ ingredientName: 'grape tomatoes', amount: 0.5, unit: 'pt' })
      const [reparsed] = parseIngredientLine(serializeIngredientLine(original), [])
      expect(reparsed).toMatchObject({ amount: 0.5, unit: 'pt', name: 'grape tomatoes' })
    })

    it('resolves back to the same catalog ingredient even when its name starts with a word the parser would otherwise treat as a strippable descriptor', () => {
      // Real catalog entries like this exist (e.g. "diced tomatoes", "fresh basil leaves") --
      // this is the scenario RecipeIngredientsEditor actually hits: reparsing against the
      // real catalog, not an empty one, every time an existing recipe's ingredients are
      // opened and saved with no changes.
      const catalog: Ingredient[] = [
        { id: 42, name: 'diced tomatoes', aliases: [], defaultUnit: null, category: 'PRODUCE', stores: [] },
      ]
      const original = row({ ingredientName: 'diced tomatoes', amount: 1, unit: 'can' })
      const [reparsed] = parseIngredientLine(serializeIngredientLine(original), catalog)
      expect(reparsed).toMatchObject({ name: 'diced tomatoes', cutType: null, matchedIngredientId: 42 })
    })
  })
})
