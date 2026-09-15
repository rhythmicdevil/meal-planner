import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Group, LoadingOverlay, MultiSelect, Stack, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { useRecipes } from '../api/recipes'
import { ApiRequestError } from '../api/client'
import { useCreateMenu, useMenu, useUpdateMenu } from '../api/menus'
import type { MenuRequest } from '../api/types'

interface MenuFormValues {
  name: string
  recipeIds: string[]
}

const emptyValues: MenuFormValues = { name: '', recipeIds: [] }

export function MenuFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const { data: existing, isLoading: isLoadingExisting } = useMenu(id)
  const { data: recipes = [] } = useRecipes()
  const createMenu = useCreateMenu()
  const updateMenu = useUpdateMenu(id ?? '')

  const form = useForm<MenuFormValues>({
    mode: 'controlled',
    initialValues: emptyValues,
    validate: {
      name: (value) => (value.trim() ? null : 'Name is required'),
    },
  })

  useEffect(() => {
    if (!existing) return
    form.setValues({
      name: existing.name,
      recipeIds: existing.recipes.map((recipe) => String(recipe.id)),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing])

  const isSaving = createMenu.isPending || updateMenu.isPending

  const handleSubmit = form.onSubmit(async (values) => {
    const request: MenuRequest = {
      name: values.name.trim(),
      recipeIds: values.recipeIds.map(Number),
    }

    try {
      const saved = isEdit
        ? await updateMenu.mutateAsync(request)
        : await createMenu.mutateAsync(request)
      notifications.show({ message: isEdit ? 'Menu updated' : 'Menu created', color: 'green' })
      navigate(`/menus/${saved.id}`)
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
      <Title order={2}>{isEdit ? 'Edit menu' : 'New menu'}</Title>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput label="Name" required {...form.getInputProps('name')} />
          <MultiSelect
            label="Recipes"
            placeholder="Search recipes…"
            searchable
            data={recipes.map((recipe) => ({ value: String(recipe.id), label: recipe.name }))}
            {...form.getInputProps('recipeIds')}
          />

          <Group justify="flex-end">
            <Button variant="default" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {isEdit ? 'Save changes' : 'Create menu'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
