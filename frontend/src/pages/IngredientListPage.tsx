import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Alert,
  Anchor,
  Button,
  Group,
  List,
  Loader,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useDeleteIngredient, useIngredients } from '../api/ingredients'
import { useRecipes } from '../api/recipes'
import {
  INGREDIENT_CATEGORIES,
  INGREDIENT_CATEGORY_LABELS,
  type Ingredient,
  type IngredientCategory,
  type Recipe,
} from '../api/types'
import { SortableTh } from '../components/SortableTh'
import { useSort } from '../hooks/useSort'

type IngredientSortKey = 'name' | 'category' | 'defaultUnit'

const ingredientComparators: Record<IngredientSortKey, (a: Ingredient, b: Ingredient) => number> = {
  name: (a, b) => a.name.localeCompare(b.name),
  category: (a, b) =>
    INGREDIENT_CATEGORY_LABELS[a.category].localeCompare(INGREDIENT_CATEGORY_LABELS[b.category]) ||
    a.name.localeCompare(b.name),
  defaultUnit: (a, b) => (a.defaultUnit ?? '').localeCompare(b.defaultUnit ?? '') || a.name.localeCompare(b.name),
}

export function IngredientListPage() {
  const { data: ingredients, isLoading, isError } = useIngredients()
  const { data: recipes } = useRecipes()
  const deleteIngredient = useDeleteIngredient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<IngredientCategory | null>(null)
  const [blocked, setBlocked] = useState<{ ingredientName: string; recipes: Recipe[] } | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const query = search.trim().toLowerCase()
  const filtered = (ingredients ?? []).filter(
    (ingredient) =>
      (query === '' ||
        ingredient.name.toLowerCase().includes(query) ||
        ingredient.aliases.some((alias) => alias.toLowerCase().includes(query))) &&
      (category === null || ingredient.category === category),
  )

  const { sortKey, direction, onSort, sorted } = useSort<Ingredient, IngredientSortKey>(
    filtered,
    ingredientComparators,
    'name',
  )

  const handleDelete = async (ingredient: Ingredient) => {
    const referencingRecipes = (recipes ?? []).filter((recipe) =>
      recipe.ingredients.some((ri) => ri.ingredientId === ingredient.id),
    )
    if (referencingRecipes.length > 0) {
      setBlocked({ ingredientName: ingredient.name, recipes: referencingRecipes })
      return
    }

    if (!window.confirm(`Delete "${ingredient.name}"? This can't be undone.`)) return
    setDeletingId(ingredient.id)
    try {
      await deleteIngredient.mutateAsync(ingredient.id)
      notifications.show({ message: 'Ingredient deleted', color: 'green' })
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong'
      notifications.show({ message, color: 'red' })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={2}>Ingredients</Title>
        <Button component={Link} to="/ingredients/new">
          New Ingredient
        </Button>
      </Group>

      <Group>
        <TextInput
          style={{ flex: 1 }}
          placeholder="Search by name or alias…"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
        />
        <Select
          placeholder="Filter by category"
          clearable
          data={INGREDIENT_CATEGORIES.map((c) => ({ value: c, label: INGREDIENT_CATEGORY_LABELS[c] }))}
          value={category}
          onChange={(value) => setCategory(value as IngredientCategory | null)}
        />
      </Group>

      {isLoading && <Loader />}
      {isError && <Alert color="red">Failed to load ingredients.</Alert>}
      {ingredients && ingredients.length === 0 && (
        <Text c="dimmed">No ingredients yet — create the first one.</Text>
      )}
      {ingredients && ingredients.length > 0 && sorted.length === 0 && (
        <Text c="dimmed">No ingredients match your search/filter.</Text>
      )}

      {sorted.length > 0 && (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <SortableTh<IngredientSortKey>
                label="Name"
                sortKey="name"
                activeKey={sortKey}
                direction={direction}
                onSort={onSort}
              />
              <SortableTh<IngredientSortKey>
                label="Category"
                sortKey="category"
                activeKey={sortKey}
                direction={direction}
                onSort={onSort}
              />
              <SortableTh<IngredientSortKey>
                label="Default Unit"
                sortKey="defaultUnit"
                activeKey={sortKey}
                direction={direction}
                onSort={onSort}
              />
              <Table.Th>Aliases</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sorted.map((ingredient) => (
              <Table.Tr key={ingredient.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/ingredients/${ingredient.id}/edit`}>
                    {ingredient.name}
                  </Anchor>
                </Table.Td>
                <Table.Td>{INGREDIENT_CATEGORY_LABELS[ingredient.category]}</Table.Td>
                <Table.Td>{ingredient.defaultUnit ?? '—'}</Table.Td>
                <Table.Td>
                  <Text c="dimmed">{ingredient.aliases.length > 0 ? ingredient.aliases.join(', ') : '—'}</Text>
                </Table.Td>
                <Table.Td>
                  <Button
                    color="red"
                    variant="subtle"
                    size="xs"
                    onClick={() => handleDelete(ingredient)}
                    loading={deletingId === ingredient.id}
                  >
                    Delete
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal opened={blocked !== null} onClose={() => setBlocked(null)} title="Can't delete ingredient">
        <Stack>
          <Text>
            "{blocked?.ingredientName}" is used in the following recipe
            {blocked && blocked.recipes.length === 1 ? '' : 's'} — remove it from each one first, then try deleting
            again:
          </Text>
          <List>
            {blocked?.recipes.map((recipe) => (
              <List.Item key={recipe.id}>
                <Anchor component={Link} to={`/recipes/${recipe.id}`} onClick={() => setBlocked(null)}>
                  {recipe.name}
                </Anchor>
              </List.Item>
            ))}
          </List>
          <Group justify="flex-end">
            <Button onClick={() => setBlocked(null)}>Close</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
