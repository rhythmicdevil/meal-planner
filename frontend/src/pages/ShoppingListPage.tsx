import { Link, useParams } from 'react-router-dom'
import { Alert, Anchor, Button, Group, List, Loader, Stack, Text, Title, UnstyledButton } from '@mantine/core'
import { useMealPlan, useShoppingList } from '../api/mealPlans'
import {
  INGREDIENT_CATEGORY_LABELS,
  type IngredientCategory,
  type ShoppingListItem,
  type ShoppingListStapleItem,
} from '../api/types'
import { useCheckedShoppingItems } from '../hooks/useCheckedShoppingItems'

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

// Same insertion-order-preserving grouping, keyed by staple group name instead of category
// (the backend already returns stapleItems pre-sorted by group name then item name).
function groupByStapleGroupName(items: ShoppingListStapleItem[]): Map<string, ShoppingListStapleItem[]> {
  const groups = new Map<string, ShoppingListStapleItem[]>()
  for (const item of items) {
    const group = groups.get(item.stapleGroupName)
    if (group) {
      group.push(item)
    } else {
      groups.set(item.stapleGroupName, [item])
    }
  }
  return groups
}

export function ShoppingListPage() {
  const { id } = useParams<{ id: string }>()
  const { data: mealPlan } = useMealPlan(id)
  const { data: shoppingList, isLoading, isError } = useShoppingList(id)
  const { checked, toggle } = useCheckedShoppingItems(id ?? '')
  // A separate checked-set/storage namespace from the ingredient items above -- a staple
  // item's id is from its own id space and could otherwise collide with an unrelated
  // ingredient id.
  const { checked: stapleChecked, toggle: toggleStaple } = useCheckedShoppingItems(`${id ?? ''}:staples`)

  if (isLoading) return <Loader m="md" />
  if (isError || !shoppingList) return <Alert color="red" m="md">Could not load shopping list.</Alert>

  return (
    <Stack maw={900} mx="auto" p="md">
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
        <Button className="no-print" variant="default" onClick={() => window.print()}>
          Print
        </Button>
      </Group>

      {shoppingList.items.length === 0 ? (
        <Text c="dimmed">Nothing to buy — no raw ingredients in this meal plan.</Text>
      ) : (
        <div className="print-columns">
          {[...groupByCategory(shoppingList.items)].map(([category, items]) => (
            <div key={category} style={{ breakInside: 'avoid', marginBottom: 'var(--mantine-spacing-lg)' }}>
              <Title order={4} mb="xs">
                {INGREDIENT_CATEGORY_LABELS[category]}
              </Title>
              <List spacing="sm" listStyleType="none">
                {items.map((item) => {
                  const isChecked = checked.has(item.ingredientId)
                  return (
                    <List.Item key={item.ingredientId}>
                      <UnstyledButton
                        onClick={() => toggle(item.ingredientId)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          textDecoration: isChecked ? 'line-through' : 'none',
                          opacity: isChecked ? 0.5 : 1,
                        }}
                      >
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
                            {item.totalAmount}
                            {item.unit ? ` ${item.unit}` : ''} {item.ingredientName}
                          </>
                        )}
                        <Text size="sm" c="dimmed">
                          {item.stapleGroupName
                            ? `From your staples: ${item.stapleGroupName}`
                            : item.sourceRecipes.map((recipe) => recipe.name).join(', ')}
                        </Text>
                      </UnstyledButton>
                    </List.Item>
                  )
                })}
              </List>
            </div>
          ))}
        </div>
      )}

      {shoppingList.stapleItems.length > 0 && (
        <>
          <Title order={3}>Staples</Title>
          <div className="print-columns">
            {[...groupByStapleGroupName(shoppingList.stapleItems)].map(([stapleGroupName, items]) => (
              <div key={stapleGroupName} style={{ breakInside: 'avoid', marginBottom: 'var(--mantine-spacing-lg)' }}>
                <Title order={4} mb="xs">
                  {stapleGroupName}
                </Title>
                <List spacing="sm" listStyleType="none">
                  {items.map((item) => {
                    const isChecked = stapleChecked.has(item.stapleItemId)
                    return (
                      <List.Item key={item.stapleItemId}>
                        <UnstyledButton
                          onClick={() => toggleStaple(item.stapleItemId)}
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            textDecoration: isChecked ? 'line-through' : 'none',
                            opacity: isChecked ? 0.5 : 1,
                          }}
                        >
                          {item.quantity > 1 ? `${item.quantity} ${item.name}` : item.name}
                        </UnstyledButton>
                      </List.Item>
                    )
                  })}
                </List>
              </div>
            ))}
          </div>
        </>
      )}
    </Stack>
  )
}
