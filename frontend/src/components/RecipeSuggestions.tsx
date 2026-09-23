import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core'
import type { RecipeSuggestion } from '../utils/suggestRecipes'

interface Props {
  suggestions: RecipeSuggestion[]
  onAdd: (recipeId: number) => void
}

export function RecipeSuggestions({ suggestions, onAdd }: Props) {
  if (suggestions.length === 0) return null

  return (
    <Stack gap="xs">
      <Text size="sm" fw={600}>
        Suggested recipes
      </Text>
      {suggestions.map(({ recipe, matchCount, matchedIngredientNames }) => (
        <Paper key={recipe.id} withBorder p="sm">
          <Group justify="space-between" wrap="nowrap" align="flex-start">
            <div>
              <Group gap="xs">
                <Text fw={500}>{recipe.name}</Text>
                <Badge variant="light">
                  {matchCount} shared ingredient{matchCount === 1 ? '' : 's'}
                </Badge>
              </Group>
              <Text size="sm" c="dimmed">
                {matchedIngredientNames.join(', ')}
              </Text>
            </div>
            <Button variant="light" size="xs" type="button" onClick={() => onAdd(recipe.id)}>
              + Add
            </Button>
          </Group>
        </Paper>
      ))}
    </Stack>
  )
}
