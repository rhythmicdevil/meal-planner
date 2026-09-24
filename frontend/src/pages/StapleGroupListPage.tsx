import { Link } from 'react-router-dom'
import { Alert, Anchor, Button, Group, Loader, Stack, Table, Text, Title } from '@mantine/core'
import { useStapleGroups } from '../api/stapleGroups'

export function StapleGroupListPage() {
  const { data: stapleGroups, isLoading, isError } = useStapleGroups()

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={2}>Staple Groups</Title>
        <Button component={Link} to="/staple-groups/new">
          New Staple Group
        </Button>
      </Group>

      {isLoading && <Loader />}
      {isError && <Alert color="red">Failed to load staple groups.</Alert>}
      {stapleGroups && stapleGroups.length === 0 && (
        <Text c="dimmed">No staple groups yet — create the first one.</Text>
      )}

      {stapleGroups && stapleGroups.length > 0 && (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Items</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {stapleGroups.map((stapleGroup) => (
              <Table.Tr key={stapleGroup.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/staple-groups/${stapleGroup.id}`}>
                    {stapleGroup.name}
                  </Anchor>
                </Table.Td>
                <Table.Td>{stapleGroup.items.length}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  )
}
