import { useEffect } from 'react'
import { Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useCreateIngredient } from '../api/ingredients'
import { INGREDIENT_CATEGORIES, INGREDIENT_CATEGORY_LABELS, type Ingredient, type IngredientCategory } from '../api/types'

interface AddIngredientModalProps {
  opened: boolean
  onClose: () => void
  initialName?: string
  onCreated: (ingredient: Ingredient) => void
}

interface QuickAddValues {
  name: string
  category: IngredientCategory | null
  defaultUnit: string
}

export function AddIngredientModal({ opened, onClose, initialName = '', onCreated }: AddIngredientModalProps) {
  const createIngredient = useCreateIngredient()

  const form = useForm<QuickAddValues>({
    mode: 'controlled',
    initialValues: { name: initialName, category: null, defaultUnit: '' },
    validate: {
      name: (v) => (v.trim() ? null : 'Name is required'),
      category: (v) => (v ? null : 'Category is required'),
    },
  })

  // Re-seed the name every time the dialog opens, since a fresh open (from a different
  // ingredient search, or a different staple item) should start from that context's text,
  // not whatever was left over from the last time this dialog was used.
  useEffect(() => {
    if (opened) {
      form.setValues({ name: initialName, category: null, defaultUnit: '' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, initialName])

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      const created = await createIngredient.mutateAsync({
        name: values.name.trim(),
        category: values.category as IngredientCategory,
        defaultUnit: values.defaultUnit.trim() || null,
      })
      onCreated(created)
      form.reset()
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.fieldErrors) {
          form.setErrors(err.fieldErrors)
        }
        notifications.show({ message: err.message, color: 'red' })
      } else {
        notifications.show({ message: 'Something went wrong', color: 'red' })
      }
    }
  })

  return (
    <Modal opened={opened} onClose={onClose} title="Add ingredient">
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput label="Name" required {...form.getInputProps('name')} />
          <Select
            label="Category"
            required
            data={INGREDIENT_CATEGORIES.map((category) => ({
              value: category,
              label: INGREDIENT_CATEGORY_LABELS[category],
            })).sort((a, b) => a.label.localeCompare(b.label))}
            searchable
            {...form.getInputProps('category')}
          />
          <TextInput label="Default unit" placeholder="e.g. each, g" {...form.getInputProps('defaultUnit')} />
          <Group justify="flex-end">
            <Button type="submit" loading={createIngredient.isPending}>
              Add ingredient
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
