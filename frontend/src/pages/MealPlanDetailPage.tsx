import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Anchor, Button, Group, List, Loader, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useDeleteMealPlan, useMealPlan } from '../api/mealPlans'

export function MealPlanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: mealPlan, isLoading, isError } = useMealPlan(id)
  const deleteMealPlan = useDeleteMealPlan()

  if (isLoading) return <Loader m="md" />
  if (isError || !mealPlan) return <Alert color="red" m="md">Meal plan not found.</Alert>

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${mealPlan.name}"? This can't be undone.`)) return
    try {
      await deleteMealPlan.mutateAsync(mealPlan.id)
      notifications.show({ message: 'Meal plan deleted', color: 'green' })
      navigate('/meal-plans')
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong'
      notifications.show({ message, color: 'red' })
    }
  }

  return (
    <Stack maw={700} mx="auto" p="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>{mealPlan.name}</Title>
          {(mealPlan.startDate || mealPlan.endDate) && (
            <Text c="dimmed">
              {mealPlan.startDate ?? '…'} – {mealPlan.endDate ?? '…'}
            </Text>
          )}
        </div>
        <Group>
          <Button component={Link} to={`/meal-plans/${mealPlan.id}/shopping-list`}>
            Shopping List
          </Button>
          <Button component={Link} to={`/meal-plans/${mealPlan.id}/prep-list`}>
            Prep List
          </Button>
          <Button component={Link} to={`/meal-plans/${mealPlan.id}/edit`} variant="default">
            Edit
          </Button>
          <Button color="red" variant="light" onClick={handleDelete} loading={deleteMealPlan.isPending}>
            Delete
          </Button>
        </Group>
      </Group>

      <Title order={4}>Items</Title>
      {mealPlan.items.length === 0 ? (
        <Text c="dimmed">No items in this meal plan yet.</Text>
      ) : (
        <List>
          {mealPlan.items.map((item) =>
            item.itemType === 'RECIPE' && item.recipe ? (
              <List.Item key={item.id}>
                <Anchor component={Link} to={`/recipes/${item.recipe.id}`}>
                  {item.recipe.name}
                </Anchor>
              </List.Item>
            ) : item.menu ? (
              <List.Item key={item.id}>
                <Anchor component={Link} to={`/menus/${item.menu.id}`}>
                  {item.menu.name}
                </Anchor>
                {item.menu.recipes.length > 0 && (
                  <Text span c="dimmed">
                    {' '}
                    ({item.menu.recipes.map((recipe) => recipe.name).join(', ')})
                  </Text>
                )}
              </List.Item>
            ) : null,
          )}
        </List>
      )}
    </Stack>
  )
}
