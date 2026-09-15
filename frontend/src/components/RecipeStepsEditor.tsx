import { Button, Group, Stack, TextInput } from '@mantine/core'
import type { UseFormReturnType } from '@mantine/form'
import type { RecipeFormValues } from '../types/recipeForm'

interface Props {
  form: UseFormReturnType<RecipeFormValues>
}

export function RecipeStepsEditor({ form }: Props) {
  return (
    <Stack>
      {form.values.steps.map((_, index) => (
        <Group key={index} align="flex-end" wrap="nowrap">
          <TextInput
            style={{ flex: 1 }}
            label={`Step ${index + 1}`}
            {...form.getInputProps(`steps.${index}`)}
          />
          <Button
            color="red"
            variant="subtle"
            type="button"
            onClick={() => form.removeListItem('steps', index)}
          >
            Remove
          </Button>
        </Group>
      ))}
      <Button variant="light" type="button" onClick={() => form.insertListItem('steps', '')}>
        + Add step
      </Button>
    </Stack>
  )
}
