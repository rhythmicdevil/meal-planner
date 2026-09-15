import { Link } from 'react-router-dom'
import { Alert, Anchor, Button, Group, Loader, Stack, Table, Text, Title } from '@mantine/core'
import { useMenus } from '../api/menus'

export function MenuListPage() {
  const { data: menus, isLoading, isError } = useMenus()

  return (
    <Stack p="md">
      <Group justify="space-between">
        <Title order={2}>Menus</Title>
        <Button component={Link} to="/menus/new">
          New Menu
        </Button>
      </Group>

      {isLoading && <Loader />}
      {isError && <Alert color="red">Failed to load menus.</Alert>}
      {menus && menus.length === 0 && <Text c="dimmed">No menus yet — create the first one.</Text>}

      {menus && menus.length > 0 && (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Recipes</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {menus.map((menu) => (
              <Table.Tr key={menu.id}>
                <Table.Td>
                  <Anchor component={Link} to={`/menus/${menu.id}`}>
                    {menu.name}
                  </Anchor>
                </Table.Td>
                <Table.Td>{menu.recipes.length}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  )
}
