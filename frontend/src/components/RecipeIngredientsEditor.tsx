import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Group, Stack, Text } from '@mantine/core'
import type { UseFormReturnType } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useCreateIngredient, useIngredients } from '../api/ingredients'
import type { RecipeFormValues, RecipeIngredientRow } from '../types/recipeForm'
import { formatIngredientLineSummary } from '../utils/formatIngredientLineSummary'
import { guessIngredientCategory } from '../utils/guessIngredientCategory'
import { parseIngredientLine } from '../utils/parseIngredientLine'
import { serializeIngredientsToText } from '../utils/serializeIngredientLine'
import { BulkPasteModal } from './BulkPasteModal'

interface Props {
  form: UseFormReturnType<RecipeFormValues>
  initialBulkPasteText?: string
}

// Ingredients are edited exclusively through the Paste Ingredients text box -- there is no
// per-row form. Adding one ingredient at a time and editing one field at a time were both
// dropped in favor of a single text box that's the whole list, both for a brand-new recipe
// and for re-editing an existing one (pre-filled via serializeIngredientsToText).
export function RecipeIngredientsEditor({ form, initialBulkPasteText }: Props) {
  const rows = form.values.ingredients
  const { data: ingredients = [], isLoading: isLoadingIngredients } = useIngredients()
  const createIngredient = useCreateIngredient()
  const [pasteOpen, setPasteOpen] = useState(false)

  // Bulk-pasted lines almost never match an existing catalog entry on a fresh install --
  // leaving them unlinked would fail every row's "select an ingredient" validation, which
  // defeats the point of a *bulk* add. So unmatched-but-named lines get their ingredient
  // auto-created, with a best-guess category from guessIngredientCategory (a keyword
  // heuristic, not a rigorous classifier -- the notification below flags misses for review).
  //
  // Replaces the whole ingredients list rather than appending to it -- the text box always
  // shows (and this always saves) the complete set, matching what the user sees on screen.
  // A line that can't be resolved to a real ingredient (unparseable, or auto-create failed)
  // is skipped rather than added half-filled-in, since there's no per-row form left to fix it
  // in place; the notification quotes the raw line so it can be corrected and re-pasted.
  const applyIngredientsText = async (text: string) => {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    const createdIdByName = new Map<string, number>()
    const newRows: RecipeIngredientRow[] = []
    const skippedLines: string[] = []
    let createFailedCount = 0

    for (const line of lines) {
      for (const parsed of parseIngredientLine(line, ingredients)) {
        let ingredientId = parsed.matchedIngredientId

        if (ingredientId === null && parsed.name) {
          const key = parsed.name.toLowerCase()
          const alreadyCreated = createdIdByName.get(key)
          if (alreadyCreated !== undefined) {
            ingredientId = alreadyCreated
          } else {
            // One line's auto-create failing (e.g. a duplicate-name conflict from the
            // backend) shouldn't abort the whole paste -- skip that line, like an
            // unparseable one, and keep going instead of losing every other line too.
            try {
              const created = await createIngredient.mutateAsync({
                name: parsed.name,
                category: guessIngredientCategory(parsed.name),
              })
              ingredientId = created.id
              createdIdByName.set(key, created.id)
            } catch {
              createFailedCount += 1
            }
          }
        }

        if (ingredientId === null) {
          skippedLines.push(parsed.raw)
          continue
        }

        newRows.push({
          ingredientId,
          amount: parsed.amount ?? '',
          unit: parsed.unit,
          cutType: parsed.cutType,
          cutTypeOther: '',
          stateCondition: parsed.stateCondition,
          stateConditionOther: parsed.stateConditionOther ?? '',
          notes: parsed.notes,
        })
      }
    }

    form.setFieldValue('ingredients', newRows)

    const createdCount = createdIdByName.size
    const parts = [`Saved ${newRows.length} ingredient${newRows.length === 1 ? '' : 's'}.`]
    if (createdCount > 0) {
      parts.push(`Created ${createdCount} new catalog ingredient${createdCount === 1 ? '' : 's'} with a best-guess category — double-check them when you get a chance.`)
    }
    if (skippedLines.length > 0) {
      parts.push(`Couldn't resolve ${skippedLines.length} line${skippedLines.length === 1 ? '' : 's'}, so ${skippedLines.length === 1 ? "it wasn't" : "they weren't"} added: "${skippedLines.join('", "')}".`)
    }
    if (createFailedCount > 0) {
      parts.push(`${createFailedCount} ingredient${createFailedCount === 1 ? '' : 's'} couldn't be created — try again.`)
    }
    notifications.show({
      message: parts.join(' '),
      color: skippedLines.length > 0 || createFailedCount > 0 ? 'yellow' : 'green',
    })
  }

  // Waits for the catalog to finish loading before auto-importing -- otherwise every line
  // looks unmatched against an empty catalog and gets (re-)created, colliding with
  // already-existing ingredients of the same name. Also guards against React 18/19
  // StrictMode's dev-mode double-invocation of effects, which would otherwise double-add
  // (and double-create) the imported ingredients.
  const hasAutoImported = useRef(false)
  useEffect(() => {
    if (initialBulkPasteText && !hasAutoImported.current && !isLoadingIngredients) {
      hasAutoImported.current = true
      void applyIngredientsText(initialBulkPasteText)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingIngredients])

  // Looked up once per ingredients-list change rather than with a fresh .find() per row on
  // every render.
  const ingredientNameById = useMemo(
    () => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.name])),
    [ingredients],
  )

  const currentIngredientsText = useMemo(
    () =>
      serializeIngredientsToText(
        rows.map((row) => ({ ...row, ingredientName: ingredientNameById.get(row.ingredientId) ?? '' })),
      ),
    [rows, ingredientNameById],
  )

  return (
    <Stack>
      {rows.length === 0 ? (
        <Text c="dimmed">No ingredients yet.</Text>
      ) : (
        <Stack gap={4}>
          {rows.map((row, index) => {
            const ingredientName = ingredientNameById.get(row.ingredientId) ?? ''
            return <Text key={index}>{formatIngredientLineSummary({ ...row, ingredientName })}</Text>
          })}
        </Stack>
      )}

      <Group>
        {/* Disabled while the catalog is still loading -- the pre-filled text comes from
            ingredientNameById, which is empty until useIngredients() resolves. Opening (and
            saving) this before then would show every existing row with a blank name, and
            saving that drops every unnamed line as unresolved (see applyIngredientsText). */}
        <Button
          variant="default"
          type="button"
          disabled={isLoadingIngredients}
          onClick={() => setPasteOpen(true)}
        >
          {rows.length === 0 ? 'Add ingredients' : 'Edit ingredients'}
        </Button>
      </Group>

      <BulkPasteModal
        opened={pasteOpen}
        onClose={() => setPasteOpen(false)}
        title="Ingredients"
        description="One ingredient per line, e.g. '4 cups cherry tomatoes' or '1 tsp salt'. Ingredients not already in your catalog get created automatically, with a best-guess category."
        placeholder={'4 cups cherry tomatoes\n1 tablespoon olive oil\n1 teaspoon kosher salt\n…'}
        initialText={currentIngredientsText}
        submitLabel="Save"
        onSubmit={applyIngredientsText}
      />
    </Stack>
  )
}
