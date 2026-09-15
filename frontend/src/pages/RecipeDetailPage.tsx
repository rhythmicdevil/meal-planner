import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Anchor,
  Badge,
  Button,
  Group,
  List,
  Loader,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useDeleteRecipe, useRecipe } from '../api/recipes'

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: recipe, isLoading, isError } = useRecipe(id)
  const deleteRecipe = useDeleteRecipe()

  if (isLoading) return <Loader m="md" />
  if (isError || !recipe) return <Alert color="red" m="md">Recipe not found.</Alert>

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${recipe.name}"? This can't be undone.`)) return
    await deleteRecipe.mutateAsync(recipe.id)
    notifications.show({ message: 'Recipe deleted', color: 'green' })
    navigate('/recipes')
  }

  return (
    <Stack maw={700} mx="auto" p="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>{recipe.name}</Title>
          {recipe.sourceUrl && (
            <Text c="dimmed">
              Source:{' '}
              <Anchor href={recipe.sourceUrl} target="_blank" rel="noreferrer">
                {recipe.sourceUrl}
              </Anchor>
            </Text>
          )}
        </div>
        <Group>
          <Button component={Link} to={`/recipes/${recipe.id}/edit`} variant="default">
            Edit
          </Button>
          <Button color="red" variant="light" onClick={handleDelete} loading={deleteRecipe.isPending}>
            Delete
          </Button>
        </Group>
      </Group>

      <Group gap="xs">
        {recipe.servings && <Badge variant="outline">Serves {recipe.servings}</Badge>}
        {recipe.tags.map((tag) => (
          <Badge key={tag} variant="light">
            {tag}
          </Badge>
        ))}
      </Group>

      <Title order={4}>Ingredients</Title>
      <List>
        {recipe.ingredients.map((ingredient) => (
          <List.Item key={ingredient.id}>
            {[ingredient.amount, ingredient.unit].filter((part) => part !== null && part !== '').join(' ')}{' '}
            {ingredient.ingredientName}
            {ingredient.cutType && (
              <Text span c="dimmed">
                {' '}
                ({ingredient.cutType === 'OTHER' ? ingredient.cutTypeOther : ingredient.cutType.toLowerCase()})
              </Text>
            )}
            {ingredient.notes && (
              <Text span c="dimmed">
                {' '}
                — {ingredient.notes}
              </Text>
            )}
          </List.Item>
        ))}
      </List>

      <Title order={4}>Steps</Title>
      <List type="ordered">
        {recipe.steps.map((step) => (
          <List.Item key={step.stepNumber}>{step.stepText}</List.Item>
        ))}
      </List>
    </Stack>
  )
}
