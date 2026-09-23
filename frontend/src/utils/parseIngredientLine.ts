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

// Intensifiers that can precede a size descriptor ("very small onion", "extra large egg") --
// kept from the ingredient name as one leftover phrase (see stripLeadingDescriptors) rather
// than as two separate note fragments, since "very"/"extra" alone means nothing without the
// size word next to it.
const SIZE_INTENSIFIERS = new Set(['very', 'extra', 'super'])

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
  'fresh',
  'ground',
  'crumbled',
  'cracked',
])

// Words that look like a CUT_TYPE_KEYWORDS match ("whole") but are actually part of a
// compound ingredient name ("whole wheat", "whole milk"), not a prep description of the
// noun that follows -- e.g. "whole wheat tortillas" must stay intact rather than becoming
// name "wheat tortillas" with a fabricated cutType of WHOLE.
const WHOLE_COMPOUND_EXCEPTIONS = new Set(['wheat', 'grain', 'grains', 'milk'])

// Retail-package container words -- "package"/"can"/"box" aren't part of an ingredient's
// identity (see extractPackageSize below), but the user may still want to know it came in
// one, so it's folded into notes rather than dropped.
const CONTAINER_NOUNS = new Set([
  'package',
  'packages',
  'can',
  'cans',
  'box',
  'boxes',
  'bag',
  'bags',
  'block',
  'blocks',
  'jar',
  'jars',
  'container',
  'containers',
  'carton',
  'cartons',
  'bottle',
  'bottles',
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
  'c',
  'stalk',
  'stalks',
])

// Canonical shorthand for units that have a standard abbreviation -- e.g. "tablespoon(s)"
// always becomes "tbsp", "ounce(s)" always becomes "oz", matching how recipe sites and
// grocery lists conventionally abbreviate these. Count-nouns without a real abbreviation
// (clove, can, pinch, slice, stick, bunch, head, sprig, stalk, each) are left as typed --
// only actual units of weight/volume are covered here. Plural forms fold into the same
// singular abbreviation ("cups"/"c" -> "cup", "pounds"/"lbs" -> "lb") since an abbreviation
// doesn't conventionally pluralize.
const UNIT_ABBREVIATIONS: Record<string, string> = {
  cup: 'cup',
  cups: 'cup',
  c: 'cup',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  ounce: 'oz',
  ounces: 'oz',
  pound: 'lb',
  pounds: 'lb',
  lbs: 'lb',
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  milliliter: 'ml',
  milliliters: 'ml',
  liter: 'l',
  liters: 'l',
  quart: 'qt',
  quarts: 'qt',
  pint: 'pt',
  pints: 'pt',
  gallon: 'gal',
  gallons: 'gal',
}

function normalizeUnit(unit: string): string {
  return UNIT_ABBREVIATIONS[unit] ?? unit
}

// Some recipe sites mark up a fraction like "1/3" using the Unicode FRACTION SLASH (U+2044,
// "⁄") instead of a plain "/", with each glyph in its own element -- when that gets flattened
// to plain text (by our import fetch or the site's own JSON-LD), it comes through as "1 ⁄3"
// with a stray space instead of "1/3". Accepting either slash character, with optional
// whitespace around it, keeps that from being misread as a whole "1" plus a junk "⁄3" name.
const SLASH = '[/⁄]'

function parseLeadingAmount(text: string): { amount: number; rest: string } | null {
  const trimmed = text.trimStart()

  // Mixed number with a plain fraction: "1 1/2 cups" (also "1 1⁄2 cups", "1 1 ⁄ 2 cups")
  let match = trimmed.match(new RegExp(`^(\\d+)\\s+(\\d+)\\s*${SLASH}\\s*(\\d+)\\s*(.*)$`))
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

  // Plain fraction: "1/2 cup" (also "1⁄2 cup", "1 ⁄2 cup")
  match = trimmed.match(new RegExp(`^(\\d+)\\s*${SLASH}\\s*(\\d+)\\s*(.*)$`))
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

  // Amount range ("14 to 15 ounces", "2-3 cloves") -- take the upper bound, favoring
  // having enough over running short (checked before the plain integer case below,
  // which would otherwise grab just the first number and leave "to 15 ounces..." as
  // unparseable junk).
  match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:to|-)\s*(\d+(?:\.\d+)?)\s*(.*)$/)
  if (match) {
    const [, , upper, rest] = match
    return { amount: Number(upper), rest }
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
    return { unit: normalizeUnit(normalized), remainder }
  }

  return { unit: '', remainder: trimmed }
}

// Recognizes a retail package size fused right after a bare leading "1" -- e.g. "1 10-oz
// package fresh cheese tortellini" (hyphenated) or "1 28 oz can whole tomatoes" (plain
// space). The bare "1" is almost always just "one of these," so what actually matters for
// the catalog/shopping list is the number+unit that follows; the container word
// ("package"/"can") that follows *that* gets pulled out too, so it doesn't stay stuck in the
// name (see stripLeadingDescriptors's leading-word stripping, which can't see across a
// number token to find it).
function extractPackageSize(rest: string): { amount: number; unit: string; note: string; remainder: string } | null {
  const match = rest.match(/^(\d+(?:\.\d+)?)[-\s]+([a-zA-Z]+)\.?\s+(\S+)\s*(.*)$/)
  if (!match) return null
  const [, amountText, unitWord, containerWord, remainder] = match
  if (!KNOWN_UNITS.has(unitWord.toLowerCase())) return null
  if (!CONTAINER_NOUNS.has(containerWord.toLowerCase().replace(/[.,]$/, ''))) return null
  return { amount: Number(amountText), unit: normalizeUnit(unitWord.toLowerCase()), note: containerWord, remainder }
}

// Splits on the first comma that's outside any parentheses -- e.g. "sun-dried tomatoes
// (finely diced, packed in oil)" has its only comma *inside* the aside, so it must stay
// there rather than being torn in half into name="...(finely diced" / notes="packed in oil)".
// A depth-0 comma is a real name/notes boundary; a comma inside "(...)" never is (nested
// parens aren't a real recipe-text case, but the depth counter costs nothing to keep general).
function splitNameAndNotes(text: string): { name: string; notes: string } {
  let depth = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
    else if (ch === ',' && depth === 0) {
      // The notes half can itself be one fully-parenthesized clause -- e.g. "large stalks
      // celery, (sliced on a bias)" -- which should read as notes "sliced on a bias", not
      // literally keep its own wrapping parens.
      return { name: text.slice(0, i).trim(), notes: stripRedundantOuterParens(text.slice(i + 1).trim()) }
    }
  }
  return { name: text.trim(), notes: '' }
}

// If the whole string is wrapped in one fully-redundant extra pair of parens -- e.g. a
// doubly-wrapped "((cooked according to package instructions))" -- collapses it down to the
// bare content. Only strips a pair when its open paren's *matching* close is the very last
// character (repeating for multiple redundant layers); "shredded (See Note 1)" doesn't
// qualify, since its leading "s" isn't a "(", so a genuine nested annotation like that is
// left alone rather than being torn open.
function stripRedundantOuterParens(text: string): string {
  let result = text.trim()
  while (result.startsWith('(') && result.endsWith(')')) {
    let depth = 0
    let closesEarly = false
    for (let i = 0; i < result.length - 1; i++) {
      if (result[i] === '(') depth++
      else if (result[i] === ')' && --depth === 0) {
        closesEarly = true
        break
      }
    }
    if (closesEarly) break
    result = result.slice(1, -1).trim()
  }
  return result
}

// Pulls a trailing parenthetical aside (e.g. "romano cheese (or vegan equivalent)") out of
// the name and into notes, so an auto-created ingredient's name stays a clean catalog entry.
// Finds the *outermost* matching "(" for the final ")" by scanning backward and tracking
// depth, so a nested annotation inside the aside -- "cheddar cheese (shredded (See Note 1))"
// -- comes out whole ("shredded (See Note 1)") instead of the naive non-nesting-aware regex
// this replaced stopping at the first ")" it saw and leaving a dangling "(See Note 1))" mess.
function stripTrailingParenthetical(name: string, notes: string): { name: string; notes: string } {
  const trimmed = name.trimEnd()
  if (!trimmed.endsWith(')')) return { name, notes }

  let depth = 0
  let openIndex = -1
  for (let i = trimmed.length - 1; i >= 0; i--) {
    if (trimmed[i] === ')') depth++
    else if (trimmed[i] === '(' && --depth === 0) {
      openIndex = i
      break
    }
  }
  if (openIndex === -1) return { name, notes }

  const base = trimmed.slice(0, openIndex).trim()
  if (!base) return { name, notes }
  const aside = stripRedundantOuterParens(trimmed.slice(openIndex + 1, -1))
  return { name: base, notes: [notes, aside].filter(Boolean).join('; ') }
}

// Trailing purpose clauses ("for garnish", "to garnish", "for optional garnish", "for
// serving", "to taste") describe how an ingredient is used, not what it is -- e.g. "sesame
// seeds for optional garnish" should name the ingredient "sesame seeds", not carry the whole
// clause into the catalog name. Deliberately a closed vocabulary rather than a bare
// "for|to .+$" match, so it can't eat an ingredient name that legitimately ends in "for"/"to"
// for an unrelated reason.
const PURPOSE_CLAUSE_RE =
  /\s+(?:for|to)\s+(?:optional\s+)?(?:garnish(?:ing)?|serving|topping|dipping|frying|cooking|drizzling|taste)\.?$/i

function stripTrailingPurposeClause(name: string): { name: string; clause: string } {
  const match = name.match(PURPOSE_CLAUSE_RE)
  if (!match || match.index === undefined) return { name, clause: '' }
  const base = name.slice(0, match.index).trim()
  if (!base) return { name, clause: '' }
  return { name: base, clause: match[0].trim() }
}

// Strips leading size descriptors ("large onion" -> "onion") and a leading cut-type
// phrase ("finely sliced basil" -> "basil", cutType SLICED) off the front of a name, so
// the catalog ingredient name stays canonical and the cut type lands in its own field
// instead of being stuck in the name or dumped as free text.
function stripLeadingDescriptors(name: string): { name: string; cutType: CutType | null; leftovers: string[] } {
  const words = name.split(/\s+/).filter(Boolean)
  const leftovers: string[] = []
  let cutType: CutType | null = null

  while (words.length > 1) {
    const first = words[0].toLowerCase()
    if (SIZE_DESCRIPTORS.has(first)) {
      leftovers.push(words.shift()!)
      continue
    }
    if (SIZE_INTENSIFIERS.has(first) && words.length > 2 && SIZE_DESCRIPTORS.has(words[1].toLowerCase())) {
      const intensifier = words.shift()!
      const size = words.shift()!
      leftovers.push(`${intensifier} ${size}`)
      continue
    }
    break
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
    } else if (CUT_TYPE_KEYWORDS[first] && !(first === 'whole' && second && WHOLE_COMPOUND_EXCEPTIONS.has(second))) {
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

// Splits a comma/"and"-joined list of items into individual parts -- "salt and pepper" and
// "oregano, crushed red pepper flakes, and smoked paprika" both become one entry per item.
// Shared by splitCombinedIngredients (below) and the leading-"each" handling in
// parseIngredientLine (a list following a shared amount/unit, e.g. "1 tsp each salt and
// pepper"), which is safe to split unconditionally since "each" already signals a real list --
// unlike splitCombinedIngredients's own bare-comma case, there's no risk of mistaking a
// plain descriptive comma for a list separator here.
function splitDelimitedList(text: string): string[] {
  return text
    .split(/\s*,\s*(?:and\s+)?|\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean)
}

// Recognizes lines like "salt and pepper to taste" or "kosher salt and freshly ground
// black pepper, to taste" — a combined ingredient line with no numeric amount, since
// "to taste" items rarely have one. Splits into separate ingredient names (our model
// doesn't support two ingredients sharing one row) plus a shared "to taste" note.
function splitCombinedIngredients(text: string): { names: string[]; notes: string } {
  const toTasteMatch = text.match(/^(.*?),?\s+(to taste|or to taste)$/i)
  const withoutToTaste = toTasteMatch ? toTasteMatch[1].trim() : text
  const notes = toTasteMatch ? 'to taste' : ''

  // Only treat this as an actual ingredient list if "and" shows up somewhere -- a bare
  // comma (e.g. "Cooked rice, for serving, optional") is descriptive punctuation on ONE
  // ingredient, not a list separator, and splitting on it would fabricate fake ingredients
  // out of what's really just notes. "and" is what distinguishes a real list ("flour,
  // sugar, and salt") from plain asides.
  if (!/\band\b/i.test(withoutToTaste)) {
    return { names: [withoutToTaste], notes }
  }

  const names = splitDelimitedList(withoutToTaste)
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
    // No leading amount at all -- could be a combined/"to taste" line ("salt and pepper"),
    // or just a bare ingredient name with no quantity ("salt", "Avocado oil spray"), possibly
    // with its own comma-separated notes ("Cooked rice, for serving, optional"). Either way,
    // splitCombinedIngredients always returns at least one name (the whole line, if it found
    // nothing to split on) -- leaving the name empty here would produce an unselected
    // ingredient row that silently fails the "select an ingredient" validation on submit.
    const combined = splitCombinedIngredients(raw)
    const isCombinedList = combined.names.length > 1

    return combined.names.map((rawName) => {
      // A genuine multi-ingredient split ("salt" / "pepper") has no notes of its own beyond
      // the shared "to taste" -- only a single, unsplit line can still have its own trailing
      // comma-separated notes to pull out, same as the has-leading-amount path below does.
      const { name: splitName, notes: ownNotes } = isCombinedList
        ? { name: rawName, notes: '' }
        : splitNameAndNotes(rawName)
      const stripped = stripTrailingParenthetical(splitName, mergeNotes([ownNotes, combined.notes]))
      const purposeStripped = stripTrailingPurposeClause(stripped.name)
      const { name, cutType, notes } = extractCutTypeAndClean(
        purposeStripped.name,
        mergeNotes([stripped.notes, purposeStripped.clause]),
      )
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

  // Only treat a fused "10-oz package" as a package size when the leading number is a bare
  // "1" -- "1 10-oz package X" and "10-oz package X" both unambiguously mean "one 10oz
  // package," but "3 10-oz packages X" would need actual multiplication (3 * 10oz) that
  // there's no real-world example of yet, so it's left alone rather than guessed at.
  const packageSize = leading.amount === 1 ? extractPackageSize(leading.rest) : null
  const { unit, remainder } = packageSize
    ? { unit: packageSize.unit, remainder: packageSize.remainder }
    : parseUnitAndRemainder(leading.rest)
  const amount = packageSize ? packageSize.amount : leading.amount

  // "1 tsp each salt and pepper" / "1 tsp each oregano, crushed red pepper flakes, and
  // smoked paprika" -- a real unit was already found above, and a *following* "each" marks
  // a list of ingredients that all share this same amount/unit (our model has no way to
  // represent that as one row, same reasoning as splitCombinedIngredients). This can't be
  // confused with "each" used as a unit itself ("2 each onions") since that "each" gets
  // consumed by parseUnitAndRemainder above and never reaches here as the remainder's start.
  const eachMatch = remainder.match(/^each\s+(.+)$/i)
  if (eachMatch) {
    const names = splitDelimitedList(eachMatch[1])
    return (names.length > 0 ? names : [eachMatch[1]]).map((rawName) => {
      const stripped = stripTrailingParenthetical(rawName, '')
      const purposeStripped = stripTrailingPurposeClause(stripped.name)
      const { name, cutType, notes } = extractCutTypeAndClean(
        purposeStripped.name,
        mergeNotes([stripped.notes, purposeStripped.clause]),
      )
      return {
        raw,
        amount,
        unit,
        name,
        cutType,
        notes,
        matchedIngredientId: matchCatalogIngredient(name, catalog),
      }
    })
  }

  const split = splitNameAndNotes(remainder)
  const stripped = stripTrailingParenthetical(split.name, split.notes)
  const purposeStripped = stripTrailingPurposeClause(stripped.name)
  const { name, cutType, notes } = extractCutTypeAndClean(
    purposeStripped.name,
    mergeNotes([stripped.notes, purposeStripped.clause]),
  )

  return [
    {
      raw,
      amount,
      unit,
      name,
      cutType,
      notes: packageSize ? mergeNotes([packageSize.note, notes]) : notes,
      matchedIngredientId: matchCatalogIngredient(name, catalog),
    },
  ]
}
