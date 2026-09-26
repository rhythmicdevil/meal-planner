import type { CutType, StateCondition } from '../api/types'

// Turns an enum value like "ROOM_TEMP" into "room temp" for display -- every CutType/
// StateCondition value is just a plain word (or two, underscore-joined), so a blanket
// lowercase + underscore-to-space covers all of them without a per-value label map.
function humanizeEnumValue(value: string): string {
  return value.replace(/_/g, ' ').toLowerCase()
}

export interface IngredientLineSummaryInput {
  ingredientName: string
  amount: number | ''
  unit: string
  cutType: CutType | null
  cutTypeOther: string
  stateCondition: StateCondition | null
  stateConditionOther: string
  notes: string
}

// Renders a recipe ingredient row as one compact, readable line -- "2 cloves, garlic,
// minced" -- instead of its full spread-out editor form. Every part but the ingredient
// name is optional and simply omitted when blank, rather than leaving a stray ", ".
export function formatIngredientLineSummary(row: IngredientLineSummaryInput): string {
  const amountUnit =
    row.amount === '' || row.amount === null
      ? ''
      : `${row.amount}${row.unit.trim() ? ` ${row.unit.trim()}` : ''}`

  const cutType =
    row.cutType === 'OTHER' ? row.cutTypeOther.trim() : row.cutType ? humanizeEnumValue(row.cutType) : ''

  const stateCondition =
    row.stateCondition === 'OTHER'
      ? row.stateConditionOther.trim()
      : row.stateCondition
        ? humanizeEnumValue(row.stateCondition)
        : ''

  return [amountUnit, row.ingredientName, cutType, stateCondition, row.notes.trim()].filter(Boolean).join(', ')
}
