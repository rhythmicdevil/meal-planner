import type { CutType, StateCondition } from '../api/types'

export interface SerializableIngredientRow {
  ingredientName: string
  amount: number | ''
  unit: string
  cutType: CutType | null
  cutTypeOther: string
  stateCondition: StateCondition | null
  stateConditionOther: string
  notes: string
}

// The inverse of parseIngredientLine: turns a structured recipe-ingredient row back into one
// plain-text "Paste Ingredients" line, so the paste modal can be pre-filled with an existing
// recipe's ingredients for editing instead of a separate per-row form.
//
// amount/unit/name/notes round-trip exactly. cutType rides along as a NAME PREFIX ("diced
// onion") rather than a trailing note -- parseIngredientLine already recognizes a leading
// cut-type word on the name independently of whatever the notes say afterward, so it survives
// alongside separate freeform notes without needing any parser changes. A cutType of OTHER
// has no fixed vocabulary word to prefix with, so its freeform text is folded into notes
// instead, same as stateConditionOther below.
//
// stateCondition (other than the default "raw", or the parser's own "pepper" -> ground
// default, which re-derives itself from the name every time regardless) does NOT round-trip:
// there's no textual convention for it that isn't already claimed by something else with
// different, incompatible behavior -- e.g. a "frozen"/"cooked" name prefix is already read as
// a plain descriptive word ("frozen peas" means "buy frozen peas," not "leave peas off the
// shopping list"). This is a known, accepted limitation rather than a new bracket-tag syntax
// for the user to learn.
export function serializeIngredientLine(row: SerializableIngredientRow): string {
  const cutTypeWord = row.cutType && row.cutType !== 'OTHER' ? row.cutType.toLowerCase() : ''
  const name = [cutTypeWord, row.ingredientName.trim()].filter(Boolean).join(' ')

  const amountUnit = row.amount === '' ? '' : `${row.amount}${row.unit.trim() ? ` ${row.unit.trim()}` : ''}`

  const otherNotes = [
    row.cutType === 'OTHER' ? row.cutTypeOther.trim() : '',
    row.stateCondition === 'OTHER' ? row.stateConditionOther.trim() : '',
  ].filter(Boolean)

  const nameAndNotes = [name, ...otherNotes, row.notes.trim()].filter(Boolean).join(', ')

  return [amountUnit, nameAndNotes].filter(Boolean).join(' ')
}

export function serializeIngredientsToText(rows: SerializableIngredientRow[]): string {
  return rows.map(serializeIngredientLine).join('\n')
}
