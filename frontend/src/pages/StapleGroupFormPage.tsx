import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Group, LoadingOverlay, MultiSelect, Paper, Select, Stack, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useIngredients } from '../api/ingredients'
import { useCreateStapleGroup, useStapleGroup, useUpdateStapleGroup } from '../api/stapleGroups'
import { useStores } from '../api/stores'
import type { StapleGroupRequest } from '../api/types'
import { emptyStapleGroupFormValues, emptyStapleItemRow, type StapleGroupFormValues } from '../types/stapleGroupForm'

export function StapleGroupFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const { data: existing, isLoading: isLoadingExisting } = useStapleGroup(id)
  const { data: ingredients = [] } = useIngredients()
  const { data: stores = [] } = useStores()
  const createStapleGroup = useCreateStapleGroup()
  const updateStapleGroup = useUpdateStapleGroup(id ?? '')

  const form = useForm<StapleGroupFormValues>({
    mode: 'controlled',
    initialValues: emptyStapleGroupFormValues,
    validate: {
      name: (value) => (value.trim() ? null : 'Name is required'),
      items: {
        name: (value) => (value.trim() ? null : 'Name is required'),
      },
    },
  })

  useEffect(() => {
    if (!existing) return
    form.setValues({
      name: existing.name,
      items: existing.items.map((item) => ({
        name: item.name,
        ingredientId: item.ingredientId,
        storeIds: item.stores.map((store) => store.id),
      })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing])

  const isSaving = createStapleGroup.isPending || updateStapleGroup.isPending

  const ingredientOptions = ingredients
    .map((ingredient) => ({ value: String(ingredient.id), label: ingredient.name }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const storeOptions = stores
    .map((store) => ({ value: String(store.id), label: store.name }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const handleSubmit = form.onSubmit(async (values) => {
    const request: StapleGroupRequest = {
      name: values.name.trim(),
      items: values.items.map((row) => ({
        name: row.name.trim(),
        ingredientId: row.ingredientId,
        storeIds: row.storeIds,
      })),
    }

    try {
      const saved = isEdit
        ? await updateStapleGroup.mutateAsync(request)
        : await createStapleGroup.mutateAsync(request)
      notifications.show({ message: isEdit ? 'Staple group updated' : 'Staple group created', color: 'green' })
      navigate(`/staple-groups/${saved.id}`)
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
      <Title order={2}>{isEdit ? 'Edit staple group' : 'New staple group'}</Title>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput label="Name" required placeholder="e.g. Cleaning Products" {...form.getInputProps('name')} />

          <Title order={4}>Items</Title>
          <Stack>
            {form.values.items.map((row, index) => (
              <Paper key={index} withBorder p="sm">
                <Group align="flex-start" wrap="wrap">
                  <TextInput
                    style={{ flex: 1, minWidth: 160 }}
                    label="Name"
                    placeholder="e.g. paper towels"
                    {...form.getInputProps(`items.${index}.name`)}
                  />
                  <Select
                    style={{ flex: 1, minWidth: 160 }}
                    label="Link to an ingredient (optional)"
                    placeholder="Search ingredients…"
                    searchable
                    clearable
                    data={ingredientOptions}
                    value={row.ingredientId !== null ? String(row.ingredientId) : null}
                    onChange={(value) => {
                      const ingredientId = value ? Number(value) : null
                      form.setFieldValue(`items.${index}.ingredientId`, ingredientId)
                      // Auto-fill the name from the linked ingredient, but only if nothing's
                      // been typed yet -- never clobber a deliberately different label.
                      if (ingredientId !== null && !form.values.items[index].name.trim()) {
                        const ingredient = ingredients.find((i) => i.id === ingredientId)
                        if (ingredient) {
                          form.setFieldValue(`items.${index}.name`, ingredient.name)
                        }
                      }
                    }}
                  />
                  <MultiSelect
                    style={{ flex: 1, minWidth: 160 }}
                    label="Stores (optional)"
                    placeholder="Where to get it…"
                    searchable
                    clearable
                    data={storeOptions}
                    value={row.storeIds.map(String)}
                    onChange={(values) => form.setFieldValue(`items.${index}.storeIds`, values.map(Number))}
                  />
                  <Button
                    color="red"
                    variant="subtle"
                    type="button"
                    mt={24}
                    onClick={() => form.removeListItem('items', index)}
                  >
                    Remove
                  </Button>
                </Group>
              </Paper>
            ))}
            <Button variant="light" type="button" onClick={() => form.insertListItem('items', emptyStapleItemRow())}>
              + Add item
            </Button>
          </Stack>

          <Group justify="flex-end">
            <Button variant="default" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {isEdit ? 'Save changes' : 'Create staple group'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
