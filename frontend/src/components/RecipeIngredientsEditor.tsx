import { Button, Group, NumberInput, Paper, Select, Stack, TextInput } from '@mantine/core'
import type { UseFormReturnType } from '@mantine/form'
import { CUT_TYPES, STATE_CONDITIONS } from '../api/types'
import { emptyIngredientRow, type RecipeFormValues } from '../types/recipeForm'
import { IngredientPicker } from './IngredientPicker'

interface Props {
  form: UseFormReturnType<RecipeFormValues>
}

export function RecipeIngredientsEditor({ form }: Props) {
  const rows = form.values.ingredients

  return (
    <Stack>
      {rows.map((row, index) => (
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
                min={0}
                decimalScale={3}
                {...form.getInputProps(`ingredients.${index}.amount`)}
              />
              <TextInput
                label="Unit"
                placeholder="cup, g, each…"
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
            <Button
              color="red"
              variant="subtle"
              type="button"
              onClick={() => form.removeListItem('ingredients', index)}
            >
              Remove ingredient
            </Button>
          </Stack>
        </Paper>
      ))}
      <Button
        variant="light"
        type="button"
        onClick={() => form.insertListItem('ingredients', emptyIngredientRow())}
      >
        + Add ingredient
      </Button>
    </Stack>
  )
}
