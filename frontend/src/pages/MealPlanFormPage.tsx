import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Group, LoadingOverlay, Stack, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useCreateMealPlan, useMealPlan, useUpdateMealPlan } from '../api/mealPlans'
import { useMenus } from '../api/menus'
import { useRecipes } from '../api/recipes'
import type { MealPlanRequest } from '../api/types'
import { MealPlanItemsEditor } from '../components/MealPlanItemsEditor'
import { RecipeSuggestions } from '../components/RecipeSuggestions'
import { emptyMealPlanFormValues, type MealPlanFormValues } from '../types/mealPlanForm'
import { resolveMealPlanRecipeIds } from '../utils/resolveMealPlanRecipeIds'
import { suggestRecipes } from '../utils/suggestRecipes'

export function MealPlanFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const { data: existing, isLoading: isLoadingExisting } = useMealPlan(id)
  const { data: recipes = [] } = useRecipes()
  const { data: menus = [] } = useMenus()
  const createMealPlan = useCreateMealPlan()
  const updateMealPlan = useUpdateMealPlan(id ?? '')

  const form = useForm<MealPlanFormValues>({
    mode: 'controlled',
    initialValues: emptyMealPlanFormValues,
    validate: {
      name: (value) => (value.trim() ? null : 'Name is required'),
    },
  })

  useEffect(() => {
    if (!existing) return
    form.setValues({
      name: existing.name,
      startDate: existing.startDate ?? '',
      endDate: existing.endDate ?? '',
      items: existing.items.map((item) => ({
        itemType: item.itemType,
        recipeId: item.recipe ? String(item.recipe.id) : null,
        menuId: item.menu ? String(item.menu.id) : null,
        stapleGroupId: item.stapleGroup ? String(item.stapleGroup.id) : null,
      })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing])

  const isSaving = createMealPlan.isPending || updateMealPlan.isPending

  const selectedRecipeIds = useMemo(
    () => resolveMealPlanRecipeIds(form.values.items, menus),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [form.values.items, menus],
  )
  const suggestions = useMemo(
    () => suggestRecipes(selectedRecipeIds, recipes),
    [selectedRecipeIds, recipes],
  )

  const handleSubmit = form.onSubmit(async (values) => {
    let hasItemErrors = false
    values.items.forEach((row, index) => {
      if (row.itemType === 'RECIPE' && !row.recipeId) {
        form.setFieldError(`items.${index}.recipeId`, 'Select a recipe')
        hasItemErrors = true
      }
      if (row.itemType === 'MENU' && !row.menuId) {
        form.setFieldError(`items.${index}.menuId`, 'Select a menu')
        hasItemErrors = true
      }
      if (row.itemType === 'STAPLE_GROUP' && !row.stapleGroupId) {
        form.setFieldError(`items.${index}.stapleGroupId`, 'Select a staple group')
        hasItemErrors = true
      }
    })
    if (hasItemErrors) return

    const request: MealPlanRequest = {
      name: values.name.trim(),
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      items: values.items.map((row) => ({
        itemType: row.itemType,
        recipeId: row.itemType === 'RECIPE' ? Number(row.recipeId) : null,
        menuId: row.itemType === 'MENU' ? Number(row.menuId) : null,
        stapleGroupId: row.itemType === 'STAPLE_GROUP' ? Number(row.stapleGroupId) : null,
      })),
    }

    try {
      const saved = isEdit
        ? await updateMealPlan.mutateAsync(request)
        : await createMealPlan.mutateAsync(request)
      notifications.show({ message: isEdit ? 'Meal plan updated' : 'Meal plan created', color: 'green' })
      navigate(`/meal-plans/${saved.id}`)
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
      <Title order={2}>{isEdit ? 'Edit meal plan' : 'New meal plan'}</Title>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput label="Name" required {...form.getInputProps('name')} />
          <Group grow>
            <TextInput type="date" label="Start date" {...form.getInputProps('startDate')} />
            <TextInput type="date" label="End date" {...form.getInputProps('endDate')} />
          </Group>

          <Title order={4}>Items</Title>
          <MealPlanItemsEditor form={form} />

          <RecipeSuggestions
            suggestions={suggestions}
            onAdd={(recipeId) =>
              form.insertListItem('items', {
                itemType: 'RECIPE',
                recipeId: String(recipeId),
                menuId: null,
                stapleGroupId: null,
              })
            }
          />

          <Group justify="flex-end">
            <Button variant="default" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {isEdit ? 'Save changes' : 'Create meal plan'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
