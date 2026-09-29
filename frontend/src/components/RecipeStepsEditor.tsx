import { useEffect, useRef, useState } from 'react'
import { Button, Group, Stack, Text } from '@mantine/core'
import type { UseFormReturnType } from '@mantine/form'
import type { RecipeFormValues } from '../types/recipeForm'
import { numberStepLines } from '../utils/parseStepLine'
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

// Serializes back to numbered lines ("1. Preheat the oven...") -- parseSteps already strips
// a leading "N." off any line, so pre-filling the paste box this way round-trips cleanly and
// reads the same as the plain-text display below it. A heading line keeps its "#" marker
// instead of getting a number, matching the display's unnumbered headings.
function serializeSteps(steps: string[]): string {
  return numberStepLines(steps)
    .map((line) => (line.isHeading ? `# ${line.text}` : `${line.number}. ${line.text}`))
    .join('\n')
}

// Steps are edited exclusively through the Paste Steps text box -- there is no per-step
// form. Adding, editing, reordering, and removing all happen by editing the text and
// resubmitting, same as RecipeIngredientsEditor.
export function RecipeStepsEditor({ form, initialBulkPasteText }: Props) {
  const [pasteOpen, setPasteOpen] = useState(false)
  const steps = form.values.steps

  // Replaces the whole steps list rather than appending to it -- the text box always shows
  // (and this always saves) the complete, ordered set, matching what's visibly in the box.
  const applyStepsText = (text: string) => {
    form.setFieldValue('steps', parseSteps(text))
  }

  // Guards against React 18/19 StrictMode's dev-mode double-invocation of mount effects,
  // which would otherwise double-add the imported steps.
  const hasAutoImported = useRef(false)
  useEffect(() => {
    if (initialBulkPasteText && !hasAutoImported.current) {
      hasAutoImported.current = true
      applyStepsText(initialBulkPasteText)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Stack>
      {steps.length === 0 ? (
        <Text c="dimmed">No steps yet.</Text>
      ) : (
        <Stack gap={4}>
          {numberStepLines(steps).map((line, index) => (
            <Text key={index} fw={line.isHeading ? 700 : undefined}>
              {line.isHeading ? line.text : `${line.number}. ${line.text}`}
            </Text>
          ))}
        </Stack>
      )}

      <Group>
        <Button variant="default" type="button" onClick={() => setPasteOpen(true)}>
          {steps.length === 0 ? 'Add steps' : 'Edit steps'}
        </Button>
      </Group>

      <BulkPasteModal
        opened={pasteOpen}
        onClose={() => setPasteOpen(false)}
        title="Steps"
        description="One step per line. Leading numbers or bullets (1., -, •) are stripped automatically. This replaces the whole list."
        placeholder={'Preheat the oven to 425°F.\nStir together the tomatoes, oil, and salt.\n…'}
        initialText={serializeSteps(steps)}
        submitLabel="Save"
        onSubmit={applyStepsText}
      />
    </Stack>
  )
}
