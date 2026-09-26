import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button, Group, LoadingOverlay, NumberInput, Stack, TagsInput, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useCreateRecipe, useRecipe, useUpdateRecipe } from '../api/recipes'
import { useCreateTag, useTags } from '../api/tags'
import type { ImportedRecipe, RecipeRequest, Tag, TagType } from '../api/types'
import { RecipeIngredientsEditor } from '../components/RecipeIngredientsEditor'
import { RecipeStepsEditor } from '../components/RecipeStepsEditor'
import { emptyRecipeFormValues, type RecipeFormValues } from '../types/recipeForm'

// Resolves plain tag names (as typed into a TagsInput, exactly like the old freeform tags
// field) against the catalog, creating any that don't already exist as a tag of the given
// type -- mirrors how bulk-pasted ingredients auto-create an unmatched catalog entry.
// createdByName guards against creating the same brand-new name twice in one submit.
async function resolveTagIds(
  names: string[],
  type: TagType,
  catalog: Tag[],
  createTag: (name: string) => Promise<Tag>,
): Promise<number[]> {
  const createdByName = new Map<string, number>()
  const ids: number[] = []

  for (const rawName of names) {
    const name = rawName.trim()
    if (!name) continue
    const key = name.toLowerCase()

    const existing = catalog.find((tag) => tag.type === type && tag.name.toLowerCase() === key)
    let id: number
    if (existing) {
      id = existing.id
    } else if (createdByName.has(key)) {
      id = createdByName.get(key)!
    } else {
      id = (await createTag(name)).id
      createdByName.set(key, id)
    }

    if (!ids.includes(id)) {
      ids.push(id)
    }
  }

  return ids
}

export function RecipeFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const navigate = useNavigate()
  const location = useLocation()
  const imported = (location.state as { imported?: ImportedRecipe } | null)?.imported

  const { data: existing, isLoading: isLoadingExisting } = useRecipe(id)
  const { data: tags = [], isLoading: isLoadingTags } = useTags()
  const createRecipe = useCreateRecipe()
  const updateRecipe = useUpdateRecipe(id ?? '')
  const createTag = useCreateTag()

  const cuisineNameSuggestions = tags.filter((tag) => tag.type === 'CUISINE').map((tag) => tag.name)
  const descriptiveNameSuggestions = tags.filter((tag) => tag.type === 'DESCRIPTIVE').map((tag) => tag.name)

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
      cuisineTagNames: existing.cuisineTags.map((tag) => tag.name),
      descriptiveTagNames: existing.descriptiveTags.map((tag) => tag.name),
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

  // The source page's recipeCategory/recipeCuisine (e.g. "Mexican", "dinner") land in
  // imported.tags as plain strings with no way to tell which are cuisines vs. descriptive
  // labels. Best-effort: whichever imported strings match an existing CUISINE catalog tag by
  // name go into cuisine; everything else goes into descriptive tags as typed (unmatched
  // names there just get auto-created on submit, same as manually-typed ones). Waits for the
  // catalog to load and a ref guards against re-running once it has.
  const hasAppliedImportedTags = useRef(false)
  useEffect(() => {
    if (isEdit || !imported || hasAppliedImportedTags.current || isLoadingTags) return
    hasAppliedImportedTags.current = true

    const cuisineNames = new Set(
      tags.filter((tag) => tag.type === 'CUISINE').map((tag) => tag.name.toLowerCase()),
    )
    const matchedCuisines = imported.tags.filter((name) => cuisineNames.has(name.toLowerCase()))
    const descriptiveNames = imported.tags.filter((name) => !cuisineNames.has(name.toLowerCase()))

    form.setFieldValue('cuisineTagNames', matchedCuisines)
    form.setFieldValue('descriptiveTagNames', descriptiveNames)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingTags])

  const isSaving = createRecipe.isPending || updateRecipe.isPending

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      const createTagOfType = (type: TagType) => (name: string) => createTag.mutateAsync({ name, type })
      const [cuisineIds, descriptiveIds] = await Promise.all([
        resolveTagIds(values.cuisineTagNames, 'CUISINE', tags, createTagOfType('CUISINE')),
        resolveTagIds(values.descriptiveTagNames, 'DESCRIPTIVE', tags, createTagOfType('DESCRIPTIVE')),
      ])

      const request: RecipeRequest = {
        name: values.name.trim(),
        sourceUrl: values.sourceUrl.trim() || null,
        servings: values.servings === '' ? null : values.servings,
        cuisineTagIds: cuisineIds,
        descriptiveTagIds: descriptiveIds,
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
          <TagsInput
            label="Cuisine"
            placeholder="Add a cuisine and press Enter"
            data={cuisineNameSuggestions}
            {...form.getInputProps('cuisineTagNames')}
          />
          <TagsInput
            label="Descriptive tags"
            placeholder="Add a tag and press Enter"
            data={descriptiveNameSuggestions}
            {...form.getInputProps('descriptiveTagNames')}
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
