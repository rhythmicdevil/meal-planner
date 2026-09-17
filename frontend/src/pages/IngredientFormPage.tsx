import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Group, LoadingOverlay, Select, Stack, TagsInput, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useCreateIngredient, useIngredient, useUpdateIngredient } from '../api/ingredients'
import { INGREDIENT_CATEGORIES, INGREDIENT_CATEGORY_LABELS, type IngredientRequest } from '../api/types'
import { emptyIngredientFormValues, type IngredientFormValues } from '../types/ingredientForm'

export function IngredientFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const { data: existing, isLoading: isLoadingExisting } = useIngredient(id)
  const createIngredient = useCreateIngredient()
  const updateIngredient = useUpdateIngredient(id ?? '')

  const form = useForm<IngredientFormValues>({
    mode: 'controlled',
    initialValues: emptyIngredientFormValues,
    validate: {
      name: (value) => (value.trim() ? null : 'Name is required'),
      category: (value) => (value ? null : 'Category is required'),
    },
  })

  useEffect(() => {
    if (!existing) return
    form.setValues({
      name: existing.name,
      category: existing.category,
      defaultUnit: existing.defaultUnit ?? '',
      aliases: existing.aliases,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing])

  const isSaving = createIngredient.isPending || updateIngredient.isPending

  const handleSubmit = form.onSubmit(async (values) => {
    const request: IngredientRequest = {
      name: values.name.trim(),
      category: values.category!,
      defaultUnit: values.defaultUnit.trim() || null,
      aliases: values.aliases.map((alias) => alias.trim()).filter(Boolean),
    }

    try {
      if (isEdit) {
        await updateIngredient.mutateAsync(request)
      } else {
        await createIngredient.mutateAsync(request)
      }
      notifications.show({ message: isEdit ? 'Ingredient updated' : 'Ingredient created', color: 'green' })
      navigate('/ingredients')
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

  if (isEdit && isLoadingExisting) {
    return <LoadingOverlay visible />
  }

  return (
    <Stack maw={600} mx="auto" py="lg" px="md">
      <Title order={2}>{isEdit ? 'Edit ingredient' : 'New ingredient'}</Title>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput label="Name" required {...form.getInputProps('name')} />
          <Select
            label="Category"
            required
            searchable
            data={INGREDIENT_CATEGORIES.map((category) => ({
              value: category,
              label: INGREDIENT_CATEGORY_LABELS[category],
            }))}
            {...form.getInputProps('category')}
          />
          <TextInput label="Default unit" placeholder="e.g. each, g" {...form.getInputProps('defaultUnit')} />
          <TagsInput
            label="Aliases"
            placeholder="Type an alias and press Enter"
            {...form.getInputProps('aliases')}
          />

          <Group justify="flex-end">
            <Button variant="default" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {isEdit ? 'Save changes' : 'Create ingredient'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
