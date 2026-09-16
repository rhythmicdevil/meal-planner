import { useEffect, useRef, useState } from 'react'
import { Button, Group, Stack, TextInput } from '@mantine/core'
import type { UseFormReturnType } from '@mantine/form'
import type { RecipeFormValues } from '../types/recipeForm'
import { BulkPasteModal } from './BulkPasteModal'

interface Props {
  form: UseFormReturnType<RecipeFormValues>
  initialBulkPasteText?: string
}

function parseSteps(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim().replace(/^(\d+[.)]|[-*•])\s+/, ''))
    .filter((line) => line.length > 0)
}

export function RecipeStepsEditor({ form, initialBulkPasteText }: Props) {
  const [pasteOpen, setPasteOpen] = useState(false)

  const handleBulkAdd = (text: string) => {
    const parsed = parseSteps(text)
    form.setFieldValue('steps', [...form.values.steps, ...parsed])
  }

  // Guards against React 18/19 StrictMode's dev-mode double-invocation of mount effects,
  // which would otherwise double-add the imported steps.
  const hasAutoImported = useRef(false)
  useEffect(() => {
    if (initialBulkPasteText && !hasAutoImported.current) {
      hasAutoImported.current = true
      handleBulkAdd(initialBulkPasteText)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      <Group>
        <Button variant="light" type="button" onClick={() => form.insertListItem('steps', '')}>
          + Add step
        </Button>
        <Button variant="default" type="button" onClick={() => setPasteOpen(true)}>
          Paste steps
        </Button>
      </Group>

      <BulkPasteModal
        opened={pasteOpen}
        onClose={() => setPasteOpen(false)}
        title="Paste steps"
        description="One step per line. Leading numbers or bullets (1., -, •) are stripped automatically."
        placeholder={'Preheat the oven to 425°F.\nStir together the tomatoes, oil, and salt.\n…'}
        onSubmit={handleBulkAdd}
      />
    </Stack>
  )
}
