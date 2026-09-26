import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button, Group, LoadingOverlay, MultiSelect, NumberInput, Select, Stack, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useCreateRecipe, useRecipe, useUpdateRecipe } from '../api/recipes'
import { useTags } from '../api/tags'
import type { ImportedRecipe, RecipeRequest } from '../api/types'
import { RecipeIngredientsEditor } from '../components/RecipeIngredientsEditor'
import { RecipeStepsEditor } from '../components/RecipeStepsEditor'
import { emptyRecipeFormValues, type RecipeFormValues } from '../types/recipeForm'

export function RecipeFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const navigate = useNavigate()
  const location = useLocation()
  const imported = (location.state as { imported?: ImportedRecipe } | null)?.imported

  const { data: existing, isLoading: isLoadingExisting } = useRecipe(id)
  const { data: tags = [] } = useTags()
  const createRecipe = useCreateRecipe()
  const updateRecipe = useUpdateRecipe(id ?? '')

  const cuisineOptions = tags
    .filter((tag) => tag.type === 'CUISINE')
    .map((tag) => ({ value: String(tag.id), label: tag.name }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const descriptiveOptions = tags
    .filter((tag) => tag.type === 'DESCRIPTIVE')
    .map((tag) => ({ value: String(tag.id), label: tag.name }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const form = useForm<RecipeFormValues>({
    mode: 'controlled',
    initialValues: emptyRecipeFormValues,
    validate: {
      name: (value) => (value.trim() ? null : 'Name is required'),
      ingredients: {
        // amount/unit are intentionally not required — a "to taste" ingredient has no fixed quantity.
        ingredientId: (value) => (value ? null : 'Select an ingredient'),
      },
    },
  })

  useEffect(() => {
    if (!existing) return
    form.setValues({
      name: existing.name,
      sourceUrl: existing.sourceUrl ?? '',
      servings: existing.servings ?? '',
      cuisineTagId: existing.cuisineTag ? String(existing.cuisineTag.id) : null,
      descriptiveTagIds: existing.descriptiveTags.map((tag) => String(tag.id)),
      steps: [...existing.steps]
        .sort((a, b) => a.stepNumber - b.stepNumber)
        .map((step) => step.stepText),
      ingredients: existing.ingredients.map((ingredient) => ({
        ingredientId: ingredient.ingredientId,
        amount: ingredient.amount ?? '',
        unit: ingredient.unit ?? '',
        cutType: ingredient.cutType,
        cutTypeOther: ingredient.cutTypeOther ?? '',
        stateCondition: ingredient.stateCondition,
        stateConditionOther: ingredient.stateConditionOther ?? '',
        notes: ingredient.notes ?? '',
        isEditing: false,
      })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing])

  useEffect(() => {
    if (isEdit || !imported) return
    form.setValues({
      name: imported.name,
      sourceUrl: imported.sourceUrl,
      servings: imported.servings ?? '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isSaving = createRecipe.isPending || updateRecipe.isPending

  const handleSubmit = form.onSubmit(async (values) => {
    const request: RecipeRequest = {
      name: values.name.trim(),
      sourceUrl: values.sourceUrl.trim() || null,
      servings: values.servings === '' ? null : values.servings,
      cuisineTagId: values.cuisineTagId ? Number(values.cuisineTagId) : null,
      descriptiveTagIds: values.descriptiveTagIds.map(Number),
      steps: values.steps.map((stepText, index) => ({ stepNumber: index + 1, stepText })),
      ingredients: values.ingredients.map((row) => ({
        ingredientId: row.ingredientId as number,
        amount: row.amount === '' ? null : row.amount,
        unit: row.unit.trim() || null,
        cutType: row.cutType,
        cutTypeOther: row.cutTypeOther.trim() || null,
        stateCondition: row.stateCondition,
        stateConditionOther: row.stateConditionOther.trim() || null,
        notes: row.notes.trim() || null,
      })),
    }

    try {
      const saved = isEdit
        ? await updateRecipe.mutateAsync(request)
        : await createRecipe.mutateAsync(request)
      notifications.show({ message: isEdit ? 'Recipe updated' : 'Recipe created', color: 'green' })
      navigate(`/recipes/${saved.id}`)
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
    <Stack maw={700} mx="auto" py="lg" px="md">
      <Title order={2}>{isEdit ? 'Edit recipe' : 'New recipe'}</Title>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput label="Name" required {...form.getInputProps('name')} />
          <TextInput label="Source URL" placeholder="https://…" {...form.getInputProps('sourceUrl')} />
          <NumberInput label="Servings" min={1} {...form.getInputProps('servings')} />
          <Select
            label="Cuisine"
            placeholder="e.g. Mexican, Japanese, American…"
            searchable
            clearable
            data={cuisineOptions}
            {...form.getInputProps('cuisineTagId')}
          />
          <MultiSelect
            label="Descriptive tags"
            placeholder="e.g. breakfast, soup, healthy…"
            searchable
            clearable
            data={descriptiveOptions}
            {...form.getInputProps('descriptiveTagIds')}
          />

          <Title order={4}>Ingredients</Title>
          <RecipeIngredientsEditor form={form} initialBulkPasteText={imported?.ingredientLines.join('\n')} />

          <Title order={4}>Steps</Title>
          <RecipeStepsEditor form={form} initialBulkPasteText={imported?.instructionLines.join('\n')} />

          <Group justify="flex-end">
            <Button variant="default" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {isEdit ? 'Save changes' : 'Create recipe'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
