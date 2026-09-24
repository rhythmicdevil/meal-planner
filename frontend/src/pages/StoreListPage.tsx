import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Anchor, Button, Group, Loader, Stack, Table, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useDeleteStore, useStores } from '../api/stores'

export function StoreListPage() {
  const { data: stores, isLoading, isError } = useStores()
  const deleteStore = useDeleteStore()
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Delete "${name}"? Ingredients and staple items linked to it will keep their store unset.`)) {
      return
    }
    setDeletingId(id)
    try {
      await deleteStore.mutateAsync(id)
      notifications.show({ message: 'Store deleted', color: 'green' })
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
        <Title order={2}>Stores</Title>
        <Button component={Link} to="/stores/new">
          New Store
        </Button>
      </Group>

      {isLoading && <Loader />}
      {isError && <Alert color="red">Failed to load stores.</Alert>}
      {stores && stores.length === 0 && <Text c="dimmed">No stores yet — create the first one.</Text>}

      {stores && stores.length > 0 && (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {stores.map((store) => (
              <Table.Tr key={store.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/stores/${store.id}/edit`}>
                    {store.name}
                  </Anchor>
                </Table.Td>
                <Table.Td>
                  <Button
                    color="red"
                    variant="subtle"
                    size="xs"
                    onClick={() => handleDelete(store.id, store.name)}
                    loading={deletingId === store.id}
                  >
                    Delete
                  </Button>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  )
}
