import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Anchor, Badge, Button, Group, Loader, MultiSelect, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { useRecipes } from '../api/recipes'
import type { Recipe } from '../api/types'
import { SortableTh } from '../components/SortableTh'
import { useSort } from '../hooks/useSort'

type RecipeSortKey = 'name' | 'servings' | 'cuisine'

const joinedNames = (tags: { name: string }[]) => tags.map((tag) => tag.name).join(', ')

const recipeComparators: Record<RecipeSortKey, (a: Recipe, b: Recipe) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  servings: (a, b) => (a.servings ?? -Infinity) - (b.servings ?? -Infinity) || a.name.localeCompare(b.name),
  cuisine: (a, b) => joinedNames(a.cuisineTags).localeCompare(joinedNames(b.cuisineTags)) || a.name.localeCompare(b.name),
}

export function RecipeListPage() {
  const { data: recipes, isLoading, isError } = useRecipes()
  const [search, setSearch] = useState('')
  const [cuisineTags, setCuisineTags] = useState<string[]>([])
  const [descriptiveTags, setDescriptiveTags] = useState<string[]>([])

  const allCuisineTags = Array.from(
    new Set((recipes ?? []).flatMap((recipe) => recipe.cuisineTags.map((tag) => tag.name))),
  ).sort()
  const allDescriptiveTags = Array.from(
    new Set((recipes ?? []).flatMap((recipe) => recipe.descriptiveTags.map((tag) => tag.name))),
  ).sort()

  const query = search.trim().toLowerCase()
  const filtered = (recipes ?? []).filter(
    (recipe) =>
      (query === '' ||
        recipe.name.toLowerCase().includes(query) ||
        recipe.cuisineTags.some((tag) => tag.name.toLowerCase().includes(query)) ||
        recipe.descriptiveTags.some((tag) => tag.name.toLowerCase().includes(query))) &&
      cuisineTags.every((tag) => recipe.cuisineTags.some((t) => t.name === tag)) &&
      descriptiveTags.every((tag) => recipe.descriptiveTags.some((t) => t.name === tag)),
  )

  const { sortKey, direction, onSort, sorted } = useSort<Recipe, RecipeSortKey>(filtered, recipeComparators, 'name')

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={2}>Recipes</Title>
        <Group gap="xs">
          <Button variant="default" component={Link} to="/recipes/import">
            Import from URL
          </Button>
          <Button component={Link} to="/recipes/new">
            New Recipe
          </Button>
        </Group>
      </Group>

      <Group>
        <TextInput
          style={{ flex: 1 }}
          placeholder="Search by name or tag…"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        <MultiSelect
          style={{ flex: 1 }}
          placeholder="Filter by cuisine"
          clearable
          data={allCuisineTags}
          value={cuisineTags}
          onChange={setCuisineTags}
        />
        <MultiSelect
          style={{ flex: 1 }}
          placeholder="Filter by tags"
          clearable
          data={allDescriptiveTags}
          value={descriptiveTags}
          onChange={setDescriptiveTags}
        />
      </Group>

      {isLoading && <Loader />}
      {isError && <Alert color="red">Failed to load recipes.</Alert>}
      {recipes && recipes.length === 0 && <Text c="dimmed">No recipes yet — create the first one.</Text>}
      {recipes && recipes.length > 0 && sorted.length === 0 && (
        <Text c="dimmed">No recipes match your search/filter.</Text>
      )}

      {sorted.length > 0 && (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <SortableTh<RecipeSortKey>
                label="Name"
                sortKey="name"
                activeKey={sortKey}
                direction={direction}
                onSort={onSort}
              />
              <SortableTh<RecipeSortKey>
                label="Servings"
                sortKey="servings"
                activeKey={sortKey}
                direction={direction}
                onSort={onSort}
              />
              <SortableTh<RecipeSortKey>
                label="Cuisine"
                sortKey="cuisine"
                activeKey={sortKey}
                direction={direction}
                onSort={onSort}
              />
              <Table.Th>Tags</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sorted.map((recipe) => (
              <Table.Tr key={recipe.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/recipes/${recipe.id}`}>
                    {recipe.name}
                  </Anchor>
                </Table.Td>
                <Table.Td>{recipe.servings ?? '—'}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {recipe.cuisineTags.map((tag) => (
                      <Badge key={tag.id} variant="filled" color="orange">
                        {tag.name}
                      </Badge>
                    ))}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {recipe.descriptiveTags.map((tag) => (
                      <Badge key={tag.id} variant="light">
                        {tag.name}
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
