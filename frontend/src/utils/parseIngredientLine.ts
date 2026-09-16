import type { CutType, Ingredient } from '../api/types'

const CUT_TYPE_KEYWORDS: Record<string, CutType> = {
  chopped: 'CHOPPED',
  diced: 'DICED',
  minced: 'MINCED',
  julienned: 'JULIENNED',
  julienne: 'JULIENNED',
  sliced: 'SLICED',
  shredded: 'SHREDDED',
  grated: 'GRATED',
  whole: 'WHOLE',
}

const CUT_TYPE_MODIFIERS = new Set([
  'finely',
  'roughly',
  'thinly',
  'coarsely',
  'thickly',
  'lightly',
  'freshly',
])

const SIZE_DESCRIPTORS = new Set(['large', 'small', 'medium', 'jumbo'])

// Prep-state words that describe how the ingredient was bought/prepped, not what it is --
// e.g. "rinsed and drained canned black beans" should name the ingredient "black beans",
// not carry the prep instructions in the catalog name. Chained with "and"/commas below.
const PREP_QUALIFIER_WORDS = new Set([
  'rinsed',
  'drained',
  'canned',
  'peeled',
  'seeded',
  'deveined',
  'boneless',
  'skinless',
  'trimmed',
  'stemmed',
  'pitted',
  'shelled',
  'husked',
  'zested',
  'juiced',
  'toasted',
  'roasted',
  'thawed',
  'frozen',
  'dried',
  'cooked',
])

const VULGAR_FRACTIONS: Record<string, number> = {
  '¼': 0.25,
  '½': 0.5,
  '¾': 0.75,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 0.125,
  '⅜': 0.375,
  '⅝': 0.625,
  '⅞': 0.875,
}

const VULGAR_FRACTION_CHARS = Object.keys(VULGAR_FRACTIONS).join('')

const KNOWN_UNITS = new Set([
  'cup',
  'cups',
  'tablespoon',
  'tablespoons',
  'tbsp',
  'teaspoon',
  'teaspoons',
  'tsp',
  'ounce',
  'ounces',
  'oz',
  'pound',
  'pounds',
  'lb',
  'lbs',
  'gram',
  'grams',
  'g',
  'kilogram',
  'kilograms',
  'kg',
  'clove',
  'cloves',
  'can',
  'cans',
  'pinch',
  'pinches',
  'dash',
  'dashes',
  'slice',
  'slices',
  'each',
  'ml',
  'milliliter',
  'milliliters',
  'l',
  'liter',
  'liters',
  'quart',
  'quarts',
  'pint',
  'pints',
  'gallon',
  'gallons',
  'stick',
  'sticks',
  'bunch',
  'bunches',
  'head',
  'heads',
  'sprig',
  'sprigs',
])

function parseLeadingAmount(text: string): { amount: number; rest: string } | null {
  const trimmed = text.trimStart()

  // Mixed number with a plain fraction: "1 1/2 cups"
  let match = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)\s*(.*)$/)
  if (match) {
    const [, whole, num, den, rest] = match
    return { amount: Number(whole) + Number(num) / Number(den), rest }
  }

  // Mixed number with a unicode fraction, with or without a space: "1½ cups" / "1 ½ cups"
  const mixedVulgar = new RegExp(`^(\\d+)\\s*([${VULGAR_FRACTION_CHARS}])\\s*(.*)$`)
  match = trimmed.match(mixedVulgar)
  if (match) {
    const [, whole, frac, rest] = match
    return { amount: Number(whole) + VULGAR_FRACTIONS[frac], rest }
  }

  // Plain fraction: "1/2 cup"
  match = trimmed.match(/^(\d+)\/(\d+)\s*(.*)$/)
  if (match) {
    const [, num, den, rest] = match
    return { amount: Number(num) / Number(den), rest }
  }

  // Lone unicode fraction: "½ cup"
  const lonelyVulgar = new RegExp(`^([${VULGAR_FRACTION_CHARS}])\\s*(.*)$`)
  match = trimmed.match(lonelyVulgar)
  if (match) {
    const [, frac, rest] = match
    return { amount: VULGAR_FRACTIONS[frac], rest }
  }

  // Decimal or integer: "4 cups", "1.5 cups"
  match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(.*)$/)
  if (match) {
    const [, num, rest] = match
    return { amount: Number(num), rest }
  }

  return null
}

function parseUnitAndRemainder(rest: string): { unit: string; remainder: string } {
  const trimmed = rest.trim()
  const firstSpace = trimmed.indexOf(' ')
  const firstWord = firstSpace === -1 ? trimmed : trimmed.slice(0, firstSpace)
  const normalized = firstWord.toLowerCase().replace(/\.$/, '')

  if (firstWord && KNOWN_UNITS.has(normalized)) {
    const remainder = firstSpace === -1 ? '' : trimmed.slice(firstSpace + 1).trim()
    return { unit: firstWord.replace(/\.$/, ''), remainder }
  }

  return { unit: '', remainder: trimmed }
}

function splitNameAndNotes(text: string): { name: string; notes: string } {
  const commaIndex = text.indexOf(',')
  if (commaIndex === -1) {
    return { name: text.trim(), notes: '' }
  }
  return { name: text.slice(0, commaIndex).trim(), notes: text.slice(commaIndex + 1).trim() }
}

// Pulls a trailing parenthetical aside (e.g. "romano cheese (or vegan equivalent)") out of
// the name and into notes, so an auto-created ingredient's name stays a clean catalog entry.
function stripTrailingParenthetical(name: string, notes: string): { name: string; notes: string } {
  const match = name.match(/^(.*?)\s*\(([^)]*)\)\s*$/)
  if (!match) return { name, notes }
  const [, base, aside] = match
  if (!base.trim()) return { name, notes }
  return { name: base.trim(), notes: [notes, aside.trim()].filter(Boolean).join('; ') }
}

// Strips leading size descriptors ("large onion" -> "onion") and a leading cut-type
// phrase ("finely sliced basil" -> "basil", cutType SLICED) off the front of a name, so
// the catalog ingredient name stays canonical and the cut type lands in its own field
// instead of being stuck in the name or dumped as free text.
function stripLeadingDescriptors(name: string): { name: string; cutType: CutType | null; leftovers: string[] } {
  const words = name.split(/\s+/).filter(Boolean)
  const leftovers: string[] = []
  let cutType: CutType | null = null

  while (words.length > 1 && SIZE_DESCRIPTORS.has(words[0].toLowerCase())) {
    leftovers.push(words.shift()!)
  }

  while (words.length > 1) {
    const first = words[0].toLowerCase().replace(/,$/, '')
    if (PREP_QUALIFIER_WORDS.has(first)) {
      leftovers.push(words.shift()!)
      continue
    }
    if (first === 'and' && words.length > 2 && PREP_QUALIFIER_WORDS.has(words[1].toLowerCase())) {
      words.shift()
      continue
    }
    break
  }

  if (words.length > 1) {
    const first = words[0].toLowerCase()
    const second = words[1]?.toLowerCase()
    if (CUT_TYPE_MODIFIERS.has(first) && words.length > 2 && second && CUT_TYPE_KEYWORDS[second]) {
      leftovers.push(words[0])
      cutType = CUT_TYPE_KEYWORDS[second]
      words.splice(0, 2)
    } else if (CUT_TYPE_KEYWORDS[first]) {
      cutType = CUT_TYPE_KEYWORDS[first]
      words.shift()
    }
  }

  return { name: words.join(' '), cutType, leftovers }
}

// Recognizes notes that are *only* a cut-type word (optionally with one modifier), e.g. the
// "diced" in "1 onion, diced" — deliberately conservative so unrelated notes ("for garnish")
// are left untouched rather than misread as a cut type.
function extractCutTypeFromNotes(notes: string): { cutType: CutType | null; leftover: string } {
  if (!notes) return { cutType: null, leftover: notes }
  const words = notes.trim().split(/\s+/)

  if (words.length === 1 && CUT_TYPE_KEYWORDS[words[0].toLowerCase()]) {
    return { cutType: CUT_TYPE_KEYWORDS[words[0].toLowerCase()], leftover: '' }
  }
  if (
    words.length === 2 &&
    CUT_TYPE_MODIFIERS.has(words[0].toLowerCase()) &&
    CUT_TYPE_KEYWORDS[words[1].toLowerCase()]
  ) {
    return { cutType: CUT_TYPE_KEYWORDS[words[1].toLowerCase()], leftover: words[0] }
  }

  return { cutType: null, leftover: notes }
}

function mergeNotes(parts: string[]): string {
  return parts.filter(Boolean).join(', ')
}

// Recognizes lines like "salt and pepper to taste" or "kosher salt and freshly ground
// black pepper, to taste" — a combined ingredient line with no numeric amount, since
// "to taste" items rarely have one. Splits into separate ingredient names (our model
// doesn't support two ingredients sharing one row) plus a shared "to taste" note.
function splitCombinedIngredients(text: string): { names: string[]; notes: string } {
  const toTasteMatch = text.match(/^(.*?),?\s+(to taste|or to taste)$/i)
  const withoutToTaste = toTasteMatch ? toTasteMatch[1].trim() : text
  const notes = toTasteMatch ? 'to taste' : ''

  const names = withoutToTaste
    .split(/\s*,\s*(?:and\s+)?|\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)

  return { names: names.length > 0 ? names : [withoutToTaste], notes }
}

function matchCatalogIngredient(name: string, catalog: Ingredient[]): number | null {
  const normalizedName = name.toLowerCase()
  const matched = catalog.find(
    (ingredient) =>
      ingredient.name.toLowerCase() === normalizedName ||
      ingredient.aliases.some((alias) => alias.toLowerCase() === normalizedName),
  )
  return matched?.id ?? null
}

export interface ParsedIngredientLine {
  raw: string
  amount: number | null
  unit: string
  name: string
  cutType: CutType | null
  notes: string
  matchedIngredientId: number | null
}

// Cleans a name/notes pair: strips leading size descriptors and a leading or trailing
// cut-type phrase (checking the name's front and the notes' entirety), and folds
// anything stripped that isn't the cut type itself (a modifier, a size word) into notes.
function extractCutTypeAndClean(rawName: string, rawNotes: string): { name: string; cutType: CutType | null; notes: string } {
  const { name, cutType: prefixCutType, leftovers } = stripLeadingDescriptors(rawName)
  const { cutType: suffixCutType, leftover: suffixLeftover } = extractCutTypeFromNotes(rawNotes)
  return {
    name,
    cutType: prefixCutType ?? suffixCutType,
    notes: mergeNotes([...leftovers, suffixLeftover]),
  }
}

// Lightweight prefill parser for manual entry, not the fuzzy-matching import pipeline
// (CLAUDE.md §4). Usually returns one entry per line, but a combined line like "salt
// and pepper to taste" returns one entry per ingredient, since our model has no way to
// represent two ingredients on a single RecipeIngredient row.
export function parseIngredientLine(line: string, catalog: Ingredient[]): ParsedIngredientLine[] {
  const raw = line.trim()
  const leading = parseLeadingAmount(raw)

  if (!leading) {
    const combined = splitCombinedIngredients(raw)
    if (combined.names.length > 1 || combined.notes) {
      return combined.names.map((rawName) => {
        const stripped = stripTrailingParenthetical(rawName, combined.notes)
        const { name, cutType, notes } = extractCutTypeAndClean(stripped.name, stripped.notes)
        return {
          raw,
          amount: null,
          unit: '',
          name,
          cutType,
          notes,
          matchedIngredientId: matchCatalogIngredient(name, catalog),
        }
      })
    }
    return [{ raw, amount: null, unit: '', name: '', cutType: null, notes: raw, matchedIngredientId: null }]
  }

  const { unit, remainder } = parseUnitAndRemainder(leading.rest)
  const split = splitNameAndNotes(remainder)
  const stripped = stripTrailingParenthetical(split.name, split.notes)
  const { name, cutType, notes } = extractCutTypeAndClean(stripped.name, stripped.notes)

  return [
    {
      raw,
      amount: leading.amount,
      unit,
      name,
      cutType,
      notes,
      matchedIngredientId: matchCatalogIngredient(name, catalog),
    },
  ]
}
