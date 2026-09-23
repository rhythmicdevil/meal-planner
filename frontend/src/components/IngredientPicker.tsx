import { useState } from 'react'
import { Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useCreateIngredient, useIngredients } from '../api/ingredients'
import { INGREDIENT_CATEGORIES, INGREDIENT_CATEGORY_LABELS, type IngredientCategory } from '../api/types'

interface IngredientPickerProps {
  value: number | null
  onChange: (id: number | null) => void
  error?: React.ReactNode
}

interface QuickAddValues {
  name: string
  category: IngredientCategory | null
  defaultUnit: string
}

export function IngredientPicker({ value, onChange, error }: IngredientPickerProps) {
  const { data: ingredients = [], isLoading } = useIngredients()
  const createIngredient = useCreateIngredient()
  const [modalOpen, setModalOpen] = useState(false)

  const quickAddForm = useForm<QuickAddValues>({
    mode: 'controlled',
    initialValues: { name: '', category: null, defaultUnit: '' },
    validate: {
      name: (v) => (v.trim() ? null : 'Name is required'),
      category: (v) => (v ? null : 'Category is required'),
    },
  })

  const options = ingredients
    .map((ingredient) => ({ value: String(ingredient.id), label: ingredient.name }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const handleQuickAdd = quickAddForm.onSubmit(async (values) => {
    try {
      const created = await createIngredient.mutateAsync({
        name: values.name.trim(),
        category: values.category as IngredientCategory,
        defaultUnit: values.defaultUnit.trim() || null,
      })
      onChange(created.id)
      setModalOpen(false)
      quickAddForm.reset()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.fieldErrors) {
          quickAddForm.setErrors(err.fieldErrors)
        }
        notifications.show({ message: err.message, color: 'red' })
      } else {
        notifications.show({ message: 'Something went wrong', color: 'red' })
      }
    }
  })

  return (
    <>
      <Group align="flex-end" gap="xs" wrap="nowrap">
        <Select
          style={{ flex: 1 }}
          label="Ingredient"
          placeholder={isLoading ? 'Loading…' : 'Search ingredients…'}
          searchable
          clearable
          data={options}
          value={value !== null ? String(value) : null}
          onChange={(v) => onChange(v ? Number(v) : null)}
          error={error}
          nothingFoundMessage="No ingredients found"
        />
        {/* Once a row has an ingredient selected -- whether from a catalog match, a paste's
            auto-create, or a previously-saved recipe -- there's nothing left for quick-add
            to resolve; it only reappears if the selection is cleared back to empty. */}
        {value === null && (
          <Button variant="light" onClick={() => setModalOpen(true)} type="button">
            + New
          </Button>
        )}
      </Group>

      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title="Add ingredient">
        <form onSubmit={handleQuickAdd}>
          <Stack>
            <TextInput label="Name" required {...quickAddForm.getInputProps('name')} />
            <Select
              label="Category"
              required
              data={INGREDIENT_CATEGORIES.map((category) => ({
                value: category,
                label: INGREDIENT_CATEGORY_LABELS[category],
              }))}
              searchable
              {...quickAddForm.getInputProps('category')}
            />
            <TextInput
              label="Default unit"
              placeholder="e.g. each, g"
              {...quickAddForm.getInputProps('defaultUnit')}
            />
            <Group justify="flex-end">
              <Button type="submit" loading={createIngredient.isPending}>
                Add ingredient
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  )
}
