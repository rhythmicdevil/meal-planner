import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Group, LoadingOverlay, Stack, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useCreateStore, useStore, useUpdateStore } from '../api/stores'
import type { StoreRequest } from '../api/types'

export function StoreFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const { data: existing, isLoading: isLoadingExisting } = useStore(id)
  const createStore = useCreateStore()
  const updateStore = useUpdateStore(id ?? '')

  const form = useForm({
    mode: 'controlled',
    initialValues: { name: '' },
    validate: {
      name: (value) => (value.trim() ? null : 'Name is required'),
    },
  })

  useEffect(() => {
    if (!existing) return
    form.setValues({ name: existing.name })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing])

  const isSaving = createStore.isPending || updateStore.isPending

  const handleSubmit = form.onSubmit(async (values) => {
    const request: StoreRequest = { name: values.name.trim() }

    try {
      if (isEdit) {
        await updateStore.mutateAsync(request)
      } else {
        await createStore.mutateAsync(request)
      }
      notifications.show({ message: isEdit ? 'Store updated' : 'Store created', color: 'green' })
      navigate('/stores')
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
      <Title order={2}>{isEdit ? 'Edit store' : 'New store'}</Title>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput label="Name" required {...form.getInputProps('name')} />

          <Group justify="flex-end">
            <Button variant="default" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {isEdit ? 'Save changes' : 'Create store'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
