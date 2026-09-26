import { Link } from 'react-router-dom'
import { Alert, Anchor, Button, Group, List, Loader, Stack, Text, Title } from '@mantine/core'
import { useRecipes } from '../api/recipes'

export function RecipeBookPage() {
  const { data: recipes, isLoading, isError } = useRecipes()

  const sorted = [...(recipes ?? [])].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Stack maw={900} mx="auto" p="md">
      <Group justify="space-between" align="flex-start">
        <Title order={2}>Recipe Book</Title>
        <Button className="no-print" variant="default" onClick={() => window.print()}>
          Print
        </Button>
      </Group>

      {isLoading && <Loader />}
      {isError && <Alert color="red">Failed to load recipes.</Alert>}
      {recipes && recipes.length === 0 && <Text c="dimmed">No recipes yet.</Text>}

      {sorted.length > 0 && (
        <div className="print-columns">
          <List spacing="sm" listStyleType="none">
            {sorted.map((recipe) => (
              <List.Item key={recipe.id} style={{ breakInside: 'avoid' }}>
                <Anchor component={Link} to={`/recipes/${recipe.id}`}>
                  {recipe.name}
                </Anchor>
                {(recipe.cuisineTags.length > 0 || recipe.descriptiveTags.length > 0) && (
                  <Text size="sm" c="dimmed">
                    {[...recipe.cuisineTags, ...recipe.descriptiveTags].map((tag) => tag.name).join(', ')}
                  </Text>
                )}
              </List.Item>
            ))}
          </List>
        </div>
      )}
    </Stack>
  )
}
