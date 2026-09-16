import { useNavigate } from 'react-router-dom'
import { Button, Group, Stack, TextInput, Title } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useImportRecipeFromUrl } from '../api/import'

interface ImportFormValues {
  url: string
}

export function RecipeImportPage() {
  const navigate = useNavigate()
  const importRecipe = useImportRecipeFromUrl()

  const form = useForm<ImportFormValues>({
    mode: 'controlled',
    initialValues: { url: '' },
    validate: {
      url: (value) => (value.trim() ? null : 'URL is required'),
    },
  })

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      const imported = await importRecipe.mutateAsync(values.url.trim())
      navigate('/recipes/new', { state: { imported } })
    } catch (err) {
      if (err instanceof ApiRequestError) {
        notifications.show({ message: err.message, color: 'red' })
      } else {
        notifications.show({ message: 'Something went wrong', color: 'red' })
      }
    }
  })

  return (
    <Stack maw={600} mx="auto" py="lg" px="md">
      <Title order={2}>Import recipe from URL</Title>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="Recipe URL"
            placeholder="https://example.com/some-recipe"
            required
            {...form.getInputProps('url')}
          />

          <Group justify="flex-end">
            <Button variant="default" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={importRecipe.isPending}>
              Import
            </Button>
          </Group>
        </Stack>
      </form>
    </Stack>
  )
}
