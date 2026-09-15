import { Link } from 'react-router-dom'
import { Alert, Anchor, Button, Group, Loader, Stack, Table, Text, Title } from '@mantine/core'
import { useMealPlans } from '../api/mealPlans'

export function MealPlanListPage() {
  const { data: mealPlans, isLoading, isError } = useMealPlans()

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={2}>Meal Plans</Title>
        <Button component={Link} to="/meal-plans/new">
          New Meal Plan
        </Button>
      </Group>

      {isLoading && <Loader />}
      {isError && <Alert color="red">Failed to load meal plans.</Alert>}
      {mealPlans && mealPlans.length === 0 && (
        <Text c="dimmed">No meal plans yet — create the first one.</Text>
      )}

      {mealPlans && mealPlans.length > 0 && (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Dates</Table.Th>
              <Table.Th>Items</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {mealPlans.map((mealPlan) => (
              <Table.Tr key={mealPlan.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/meal-plans/${mealPlan.id}`}>
                    {mealPlan.name}
                  </Anchor>
                </Table.Td>
                <Table.Td>
                  {mealPlan.startDate || mealPlan.endDate
                    ? `${mealPlan.startDate ?? '…'} – ${mealPlan.endDate ?? '…'}`
                    : '—'}
                </Table.Td>
                <Table.Td>{mealPlan.items.length}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  )
}
