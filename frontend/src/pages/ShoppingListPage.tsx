import { Link, useParams } from 'react-router-dom'
import { Alert, Anchor, Group, List, Loader, Stack, Text, Title } from '@mantine/core'
import { useMealPlan, useShoppingList } from '../api/mealPlans'
import { INGREDIENT_CATEGORY_LABELS, type IngredientCategory, type ShoppingListItem } from '../api/types'

// The backend already returns items sorted by category then name, so grouping via a
// Map here (which preserves insertion order) keeps that order without re-sorting.
function groupByCategory(items: ShoppingListItem[]): Map<IngredientCategory, ShoppingListItem[]> {
  const groups = new Map<IngredientCategory, ShoppingListItem[]>()
  for (const item of items) {
    const group = groups.get(item.category)
    if (group) {
      group.push(item)
    } else {
      groups.set(item.category, [item])
    }
  }
  return groups
}

export function ShoppingListPage() {
  const { id } = useParams<{ id: string }>()
  const { data: mealPlan } = useMealPlan(id)
  const { data: shoppingList, isLoading, isError } = useShoppingList(id)

  if (isLoading) return <Loader m="md" />
  if (isError || !shoppingList) return <Alert color="red" m="md">Could not load shopping list.</Alert>

  return (
    <Stack maw={600} mx="auto" p="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Shopping List</Title>
          {mealPlan && (
            <Text c="dimmed">
              for{' '}
              <Anchor component={Link} to={`/meal-plans/${mealPlan.id}`}>
                {mealPlan.name}
              </Anchor>
            </Text>
          )}
        </div>
      </Group>

      {shoppingList.items.length === 0 ? (
        <Text c="dimmed">Nothing to buy — no raw ingredients in this meal plan.</Text>
      ) : (
        <Stack gap="lg">
          {[...groupByCategory(shoppingList.items)].map(([category, items]) => (
            <div key={category}>
              <Title order={4} mb="xs">
                {INGREDIENT_CATEGORY_LABELS[category]}
              </Title>
              <List spacing="sm">
                {items.map((item) => (
                  <List.Item key={item.ingredientId}>
                    {item.toTaste ? (
                      <>
                        {item.ingredientName}
                        <Text span c="dimmed">
                          {' '}
                          — to taste
                        </Text>
                      </>
                    ) : (
                      <>
                        {item.totalAmount} {item.unit} {item.ingredientName}
                      </>
                    )}
                    <Text size="sm" c="dimmed">
                      {item.sourceRecipes.map((recipe) => recipe.name).join(', ')}
                    </Text>
                  </List.Item>
                ))}
              </List>
            </div>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
