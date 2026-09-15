import { Link } from 'react-router-dom'
import { Alert, Anchor, Badge, Button, Group, Loader, Stack, Table, Text, Title } from '@mantine/core'
import { useRecipes } from '../api/recipes'

export function RecipeListPage() {
  const { data: recipes, isLoading, isError } = useRecipes()

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={2}>Recipes</Title>
        <Button component={Link} to="/recipes/new">
          New Recipe
        </Button>
      </Group>

      {isLoading && <Loader />}
      {isError && <Alert color="red">Failed to load recipes.</Alert>}
      {recipes && recipes.length === 0 && <Text c="dimmed">No recipes yet — create the first one.</Text>}

      {recipes && recipes.length > 0 && (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Servings</Table.Th>
              <Table.Th>Tags</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {recipes.map((recipe) => (
              <Table.Tr key={recipe.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/recipes/${recipe.id}`}>
                    {recipe.name}
                  </Anchor>
                </Table.Td>
                <Table.Td>{recipe.servings ?? '—'}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {recipe.tags.map((tag) => (
                      <Badge key={tag} variant="light">
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  )
}
