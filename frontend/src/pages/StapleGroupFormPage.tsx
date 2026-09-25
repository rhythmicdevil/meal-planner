import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  Grid,
  Group,
  LoadingOverlay,
  MultiSelect,
  NumberInput,
  Paper,
  SegmentedControl,
  Stack,
  TextInput,
  Title,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useIngredients } from '../api/ingredients'
import { useCreateStapleGroup, useStapleGroup, useUpdateStapleGroup } from '../api/stapleGroups'
import { useStores } from '../api/stores'
import type { StapleGroupRequest } from '../api/types'
import { AddIngredientModal } from '../components/AddIngredientModal'
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
  // Index of the item row whose "Food" toggle triggered a catalog lookup that found no
  // match -- drives the Add Ingredient dialog. Only one row can be mid-lookup at a time.
  const [pendingFoodRow, setPendingFoodRow] = useState<number | null>(null)

  const form = useForm<StapleGroupFormValues>({
    mode: 'controlled',
    initialValues: emptyStapleGroupFormValues,
    validate: {
      name: (value) => (value.trim() ? null : 'Name is required'),
      items: {
        name: (value) => (value.trim() ? null : 'Name is required'),
        quantity: (value) => (value >= 1 ? null : 'Must be at least 1'),
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
        isFood: item.ingredientId !== null,
        storeIds: item.stores.map((store) => store.id),
        quantity: item.quantity,
      })),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing])

  const isSaving = createStapleGroup.isPending || updateStapleGroup.isPending

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
        quantity: row.quantity,
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
                <Grid gap="sm" align="flex-end">
                  <Grid.Col span={{ base: 8, sm: 5 }}>
                    <TextInput
                      label="Name"
                      placeholder="e.g. paper towels"
                      {...form.getInputProps(`items.${index}.name`)}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 4, sm: 2 }}>
                    <NumberInput label="Qty" min={1} {...form.getInputProps(`items.${index}.quantity`)} />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 5 }}>
                    <Group justify="flex-end">
                      <Button
                        color="red"
                        variant="subtle"
                        type="button"
                        onClick={() => form.removeListItem('items', index)}
                      >
                        Remove
                      </Button>
                    </Group>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <SegmentedControl
                      fullWidth
                      data={[
                        { label: 'Household', value: 'household' },
                        { label: 'Food', value: 'food' },
                      ]}
                      value={row.isFood ? 'food' : 'household'}
                      onChange={(value) => {
                        const isFood = value === 'food'
                        form.setFieldValue(`items.${index}.isFood`, isFood)

                        if (!isFood) {
                          form.setFieldValue(`items.${index}.ingredientId`, null)
                          return
                        }

                        // Switching to Food: silently link a matching catalog ingredient if
                        // one exists (by exact name, case-insensitive); otherwise send the
                        // user straight to creating one instead of showing a search field.
                        // Even with no name typed yet, still open the dialog rather than
                        // leaving the row toggled to Food with nothing linked -- the name
                        // field's onChange has no way to re-trigger this match later.
                        const name = row.name.trim()
                        const match = name ? ingredients.find((i) => i.name.toLowerCase() === name.toLowerCase()) : undefined
                        if (match) {
                          form.setFieldValue(`items.${index}.ingredientId`, match.id)
                          form.setFieldValue(`items.${index}.name`, match.name)
                        } else {
                          setPendingFoodRow(index)
                        }
                      }}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 8 }}>
                    <MultiSelect
                      label="Stores (optional)"
                      placeholder="Where to get it…"
                      searchable
                      clearable
                      data={storeOptions}
                      value={row.storeIds.map(String)}
                      onChange={(values) => form.setFieldValue(`items.${index}.storeIds`, values.map(Number))}
                    />
                  </Grid.Col>
                </Grid>
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

      <AddIngredientModal
        opened={pendingFoodRow !== null}
        initialName={pendingFoodRow !== null ? form.values.items[pendingFoodRow]?.name.trim() : ''}
        onClose={() => {
          // Abandoning the dialog leaves nothing to link -- fall back to Household rather
          // than leaving the row toggled to Food with no ingredient behind it.
          if (pendingFoodRow !== null && form.values.items[pendingFoodRow]?.ingredientId === null) {
            form.setFieldValue(`items.${pendingFoodRow}.isFood`, false)
          }
          setPendingFoodRow(null)
        }}
        onCreated={(created) => {
          if (pendingFoodRow !== null) {
            form.setFieldValue(`items.${pendingFoodRow}.ingredientId`, created.id)
            form.setFieldValue(`items.${pendingFoodRow}.name`, created.name)
          }
          setPendingFoodRow(null)
        }}
      />
    </Stack>
  )
}
