import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Group, List, Loader, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useDeleteStapleGroup, useStapleGroup } from '../api/stapleGroups'

export function StapleGroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: stapleGroup, isLoading, isError } = useStapleGroup(id)
  const deleteStapleGroup = useDeleteStapleGroup()

  if (isLoading) return <Loader m="md" />
  if (isError || !stapleGroup) return <Alert color="red" m="md">Staple group not found.</Alert>

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${stapleGroup.name}"? This can't be undone.`)) return
    try {
      await deleteStapleGroup.mutateAsync(stapleGroup.id)
      notifications.show({ message: 'Staple group deleted', color: 'green' })
      navigate('/staple-groups')
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong'
      notifications.show({ message, color: 'red' })
    }
  }

  return (
    <Stack maw={700} mx="auto" p="md">
      <Group justify="space-between" align="flex-start">
        <Title order={2}>{stapleGroup.name}</Title>
        <Group>
          <Button component={Link} to={`/staple-groups/${stapleGroup.id}/edit`} variant="default">
            Edit
          </Button>
          <Button color="red" variant="light" onClick={handleDelete} loading={deleteStapleGroup.isPending}>
            Delete
          </Button>
        </Group>
      </Group>

      <Title order={4}>Items</Title>
      {stapleGroup.items.length === 0 ? (
        <Text c="dimmed">No items in this staple group yet.</Text>
      ) : (
        <List>
          {stapleGroup.items.map((item) => (
            <List.Item key={item.id}>
              {item.quantity > 1 && <Text span fw={600}>{item.quantity}× </Text>}
              {item.name}
              {item.ingredientName && (
                <Text span c="dimmed">
                  {' '}
                  — linked to {item.ingredientName}
                </Text>
              )}
              {item.stores.length > 0 && (
                <Text span c="dimmed">
                  {' '}
                  ({item.stores.map((store) => store.name).join(', ')})
                </Text>
              )}
            </List.Item>
          ))}
        </List>
      )}
    </Stack>
  )
}
