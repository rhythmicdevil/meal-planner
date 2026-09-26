import { describe, expect, it } from 'vitest'
import { formatIngredientLineSummary, type IngredientLineSummaryInput } from './formatIngredientLineSummary'

function row(overrides: Partial<IngredientLineSummaryInput>): IngredientLineSummaryInput {
  return {
    ingredientName: 'garlic',
    amount: '',
    unit: '',
    cutType: null,
    cutTypeOther: '',
    stateCondition: null,
    stateConditionOther: '',
    notes: '',
    ...overrides,
  }
}

describe('formatIngredientLineSummary', () => {
  it('formats amount, unit, ingredient, and cut type', () => {
    expect(formatIngredientLineSummary(row({ amount: 2, unit: 'cloves', cutType: 'MINCED' }))).toBe(
      '2 cloves, garlic, minced',
    )
  })

  it('shows just the ingredient name when nothing else is set', () => {
    expect(formatIngredientLineSummary(row({}))).toBe('garlic')
  })

  it('omits the unit when only an amount is set', () => {
    expect(formatIngredientLineSummary(row({ amount: 3 }))).toBe('3, garlic')
  })

  it('humanizes a multi-word state condition ("ROOM_TEMP" -> "room temp")', () => {
    expect(formatIngredientLineSummary(row({ stateCondition: 'ROOM_TEMP' }))).toBe('garlic, room temp')
  })

  it('uses the freeform "other" text instead of the literal OTHER value', () => {
    expect(
      formatIngredientLineSummary(row({ cutType: 'OTHER', cutTypeOther: 'smashed', notes: 'skin removed' })),
    ).toBe('garlic, smashed, skin removed')
  })

  it('includes every part in order when all are present', () => {
    expect(
      formatIngredientLineSummary(
        row({
          amount: 0.5,
          unit: 'cup',
          cutType: 'CHOPPED',
          stateCondition: 'FROZEN',
          notes: 'divided',
        }),
      ),
    ).toBe('0.5 cup, garlic, chopped, frozen, divided')
  })
})
