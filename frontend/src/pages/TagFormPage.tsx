import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Group, LoadingOverlay, Select, Stack, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useCreateTag, useTag, useUpdateTag } from '../api/tags'
import { TAG_TYPES, TAG_TYPE_LABELS, type TagRequest, type TagType } from '../api/types'

export function TagFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = id !== undefined
  const navigate = useNavigate()

  const { data: existing, isLoading: isLoadingExisting } = useTag(id)
  const createTag = useCreateTag()
  const updateTag = useUpdateTag(id ?? '')

  const form = useForm<{ name: string; type: TagType | null }>({
    mode: 'controlled',
    initialValues: { name: '', type: null },
    validate: {
      name: (value) => (value.trim() ? null : 'Name is required'),
      type: (value) => (value ? null : 'Type is required'),
    },
  })

  useEffect(() => {
    if (!existing) return
    form.setValues({ name: existing.name, type: existing.type })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing])

  const isSaving = createTag.isPending || updateTag.isPending

  const handleSubmit = form.onSubmit(async (values) => {
    const request: TagRequest = { name: values.name.trim(), type: values.type as TagType }

    try {
      if (isEdit) {
        await updateTag.mutateAsync(request)
      } else {
        await createTag.mutateAsync(request)
      }
      notifications.show({ message: isEdit ? 'Tag updated' : 'Tag created', color: 'green' })
      navigate('/tags')
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
      <Title order={2}>{isEdit ? 'Edit tag' : 'New tag'}</Title>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput label="Name" placeholder="e.g. Mexican, breakfast" required {...form.getInputProps('name')} />
          <Select
            label="Type"
            required
            disabled={isEdit}
            description={isEdit ? "Can't be changed once a tag exists — delete and recreate it instead" : undefined}
            data={TAG_TYPES.map((type) => ({ value: type, label: TAG_TYPE_LABELS[type] }))}
            {...form.getInputProps('type')}
          />

          <Group justify="flex-end">
            <Button variant="default" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving}>
              {isEdit ? 'Save changes' : 'Create tag'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
