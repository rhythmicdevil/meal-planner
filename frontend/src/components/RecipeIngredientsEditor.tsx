import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Group, NumberInput, Paper, Select, Stack, Text, TextInput, UnstyledButton } from '@mantine/core'
import type { UseFormReturnType } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useCreateIngredient, useIngredients } from '../api/ingredients'
import { CUT_TYPES, STATE_CONDITIONS } from '../api/types'
import { emptyIngredientRow, type RecipeFormValues, type RecipeIngredientRow } from '../types/recipeForm'
import { formatIngredientLineSummary } from '../utils/formatIngredientLineSummary'
import { guessIngredientCategory } from '../utils/guessIngredientCategory'
import { parseIngredientLine } from '../utils/parseIngredientLine'
import { BulkPasteModal } from './BulkPasteModal'
import { IngredientPicker } from './IngredientPicker'

interface Props {
  form: UseFormReturnType<RecipeFormValues>
  initialBulkPasteText?: string
}

export function RecipeIngredientsEditor({ form, initialBulkPasteText }: Props) {
  const rows = form.values.ingredients
  const { data: ingredients = [], isLoading: isLoadingIngredients } = useIngredients()
  const createIngredient = useCreateIngredient()
  const [pasteOpen, setPasteOpen] = useState(false)

  // Bulk-pasted lines almost never match an existing catalog entry on a fresh install —
  // leaving them unlinked would fail every row's "select an ingredient" validation, which
  // defeats the point of a *bulk* add. So unmatched-but-named lines get their ingredient
  // auto-created, with a best-guess category from guessIngredientCategory (a keyword
  // heuristic, not a rigorous classifier -- the notification below flags misses for review).
  const handleBulkAdd = async (text: string) => {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    const createdIdByName = new Map<string, number>()
    const newRows: RecipeIngredientRow[] = []
    let unresolvedCount = 0
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
            // backend) shouldn't abort the whole paste -- leave that row unlinked, like an
            // unparseable line, and keep going instead of losing every other row too.
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

        if (ingredientId === null) unresolvedCount += 1

        newRows.push({
          ingredientId,
          amount: parsed.amount ?? '',
          unit: parsed.unit,
          cutType: parsed.cutType,
          cutTypeOther: '',
          stateCondition: parsed.stateCondition,
          stateConditionOther: parsed.stateConditionOther ?? '',
          notes: parsed.notes,
          // Collapsed to its summary line so a big paste stays scannable -- unless nothing
          // could be linked, in which case it needs attention and starts open.
          isEditing: ingredientId === null,
        })
      }
    }

    form.setFieldValue('ingredients', [...form.values.ingredients, ...newRows])

    const createdCount = createdIdByName.size
    const parts = [`Added ${newRows.length} ingredient${newRows.length === 1 ? '' : 's'}.`]
    if (createdCount > 0) {
      parts.push(`Created ${createdCount} new catalog ingredient${createdCount === 1 ? '' : 's'} with a best-guess category — double-check them when you get a chance.`)
    }
    if (unresolvedCount > 0) {
      parts.push(`${unresolvedCount} line${unresolvedCount === 1 ? '' : 's'} couldn't be parsed — check the notes on the new row${unresolvedCount === 1 ? '' : 's'}.`)
    }
    if (createFailedCount > 0) {
      parts.push(`${createFailedCount} ingredient${createFailedCount === 1 ? '' : 's'} couldn't be created — those rows are unlinked, pick an existing ingredient or try again.`)
    }
    notifications.show({
      message: parts.join(' '),
      color: unresolvedCount > 0 || createFailedCount > 0 ? 'yellow' : 'green',
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
      void handleBulkAdd(initialBulkPasteText)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingIngredients])

  // Looked up once per ingredients-list change rather than with a fresh .find() per row on
  // every render.
  const ingredientNameById = useMemo(
    () => new Map(ingredients.map((ingredient) => [ingredient.id, ingredient.name])),
    [ingredients],
  )

  return (
    <Stack>
      {rows.map((row, index) => {
        const ingredientName =
          row.ingredientId === null ? '' : (ingredientNameById.get(row.ingredientId) ?? '')

        if (!row.isEditing && ingredientName) {
          return (
            <Paper key={index} withBorder p="sm">
              <Group justify="space-between" wrap="nowrap">
                <UnstyledButton
                  onClick={() => form.setFieldValue(`ingredients.${index}.isEditing`, true)}
                  style={{ display: 'block', flex: 1, textAlign: 'left' }}
                >
                  <Text>{formatIngredientLineSummary({ ...row, ingredientName })}</Text>
                </UnstyledButton>
                <Button
                  color="red"
                  variant="subtle"
                  size="compact-sm"
                  type="button"
                  onClick={() => form.removeListItem('ingredients', index)}
                >
                  Remove
                </Button>
              </Group>
            </Paper>
          )
        }

        return (
          <Paper key={index} withBorder p="sm">
            <Stack gap="xs">
              <IngredientPicker
                value={row.ingredientId}
                onChange={(id) => form.setFieldValue(`ingredients.${index}.ingredientId`, id)}
                error={form.errors[`ingredients.${index}.ingredientId`]}
              />
              <Group grow>
                <NumberInput
                  label="Amount"
                  placeholder="leave blank for 'to taste'"
                  min={0}
                  decimalScale={3}
                  {...form.getInputProps(`ingredients.${index}.amount`)}
                />
                <TextInput
                  label="Unit"
                  placeholder="cup, g, each… (optional)"
                  {...form.getInputProps(`ingredients.${index}.unit`)}
                />
              </Group>
              <Group grow align="flex-start">
                <Select
                  label="Cut type"
                  clearable
                  data={CUT_TYPES}
                  {...form.getInputProps(`ingredients.${index}.cutType`)}
                />
                <Select
                  label="State condition"
                  clearable
                  data={STATE_CONDITIONS}
                  {...form.getInputProps(`ingredients.${index}.stateCondition`)}
                />
              </Group>
              {(row.cutType === 'OTHER' || row.stateCondition === 'OTHER') && (
                <Group grow>
                  {row.cutType === 'OTHER' && (
                    <TextInput
                      label="Cut type (other)"
                      {...form.getInputProps(`ingredients.${index}.cutTypeOther`)}
                    />
                  )}
                  {row.stateCondition === 'OTHER' && (
                    <TextInput
                      label="State condition (other)"
                      {...form.getInputProps(`ingredients.${index}.stateConditionOther`)}
                    />
                  )}
                </Group>
              )}
              <TextInput
                label="Notes"
                placeholder="optional"
                {...form.getInputProps(`ingredients.${index}.notes`)}
              />
              <Group justify="space-between">
                <Button
                  color="red"
                  variant="subtle"
                  type="button"
                  onClick={() => form.removeListItem('ingredients', index)}
                >
                  Remove ingredient
                </Button>
                <Button
                  variant="light"
                  type="button"
                  onClick={() => form.setFieldValue(`ingredients.${index}.isEditing`, false)}
                >
                  Save
                </Button>
              </Group>
            </Stack>
          </Paper>
        )
      })}
      <Group>
        <Button
          variant="light"
          type="button"
          onClick={() => form.insertListItem('ingredients', emptyIngredientRow())}
        >
          + Add ingredient
        </Button>
        <Button variant="default" type="button" onClick={() => setPasteOpen(true)}>
          Paste ingredients
        </Button>
      </Group>

      <BulkPasteModal
        opened={pasteOpen}
        onClose={() => setPasteOpen(false)}
        title="Paste ingredients"
        description="One ingredient per line, e.g. '4 cups cherry tomatoes' or '1 tsp salt'. Ingredients not already in your catalog get created automatically, with a best-guess category."
        placeholder={'4 cups cherry tomatoes\n1 tablespoon olive oil\n1 teaspoon kosher salt\n…'}
        onSubmit={handleBulkAdd}
      />
    </Stack>
  )
}
