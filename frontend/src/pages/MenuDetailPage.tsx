import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Anchor, Button, Group, List, Loader, Stack, Text, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDeleteMenu, useMenu } from '../api/menus'

export function MenuDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: menu, isLoading, isError } = useMenu(id)
  const deleteMenu = useDeleteMenu()

  if (isLoading) return <Loader m="md" />
  if (isError || !menu) return <Alert color="red" m="md">Menu not found.</Alert>

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${menu.name}"? This can't be undone.`)) return
    await deleteMenu.mutateAsync(menu.id)
    notifications.show({ message: 'Menu deleted', color: 'green' })
    navigate('/menus')
  }

  return (
    <Stack maw={700} mx="auto" p="md">
      <Group justify="space-between" align="flex-start">
        <Title order={2}>{menu.name}</Title>
        <Group>
          <Button component={Link} to={`/menus/${menu.id}/edit`} variant="default">
            Edit
          </Button>
          <Button color="red" variant="light" onClick={handleDelete} loading={deleteMenu.isPending}>
            Delete
          </Button>
        </Group>
      </Group>

      <Title order={4}>Recipes</Title>
      {menu.recipes.length === 0 ? (
        <Text c="dimmed">No recipes in this menu yet.</Text>
      ) : (
        <List>
          {menu.recipes.map((recipe) => (
            <List.Item key={recipe.id}>
              <Anchor component={Link} to={`/recipes/${recipe.id}`}>
                {recipe.name}
              </Anchor>
              {recipe.servings && (
                <Text span c="dimmed">
                  {' '}
                  — serves {recipe.servings}
                </Text>
              )}
            </List.Item>
          ))}
        </List>
      )}
    </Stack>
  )
}
