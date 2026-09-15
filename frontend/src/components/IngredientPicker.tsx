import { useState } from 'react'
import { Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
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
    const created = await createIngredient.mutateAsync({
      name: values.name.trim(),
      category: values.category as IngredientCategory,
      defaultUnit: values.defaultUnit.trim() || null,
    })
    onChange(created.id)
    setModalOpen(false)
    quickAddForm.reset()
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
        <Button variant="light" onClick={() => setModalOpen(true)} type="button">
          + New
        </Button>
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
