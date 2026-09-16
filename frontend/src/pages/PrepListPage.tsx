import { Link, useParams } from 'react-router-dom'
import { Alert, Anchor, Group, List, Loader, Stack, Text, Title } from '@mantine/core'
import { useMealPlan, usePrepList } from '../api/mealPlans'
import type { CutType, PrepListItem } from '../api/types'

type PrepGroup = 'SMALL_PIECES' | 'SLICED_STRIPS' | 'SHREDDED_GRATED' | 'OTHER'

const GROUP_LABELS: Record<PrepGroup, string> = {
  SMALL_PIECES: 'Chop / Dice / Mince',
  SLICED_STRIPS: 'Slice / Julienne',
  SHREDDED_GRATED: 'Shred / Grate',
  OTHER: 'Other prep',
}

// Mirrors PrepListService.cutTypeGroupKey on the backend -- a display-only grouping the
// API doesn't expose, so it's re-derived here from cutType the same way, purely to batch
// similar prep work under one heading.
function prepGroup(cutType: CutType): PrepGroup {
  switch (cutType) {
    case 'CHOPPED':
    case 'DICED':
    case 'MINCED':
      return 'SMALL_PIECES'
    case 'SLICED':
    case 'JULIENNED':
      return 'SLICED_STRIPS'
    case 'SHREDDED':
    case 'GRATED':
      return 'SHREDDED_GRATED'
    default:
      return 'OTHER'
  }
}

// The backend already returns items sorted by prep group then name, so grouping via a
// Map here (which preserves insertion order) keeps that order without re-sorting.
function groupByPrepGroup(items: PrepListItem[]): Map<PrepGroup, PrepListItem[]> {
  const groups = new Map<PrepGroup, PrepListItem[]>()
  for (const item of items) {
    const group = prepGroup(item.cutType)
    const existing = groups.get(group)
    if (existing) {
      existing.push(item)
    } else {
      groups.set(group, [item])
    }
  }
  return groups
}

function describePrep(item: PrepListItem): string {
  const cutType = item.cutType === 'OTHER' ? item.cutTypeOther : item.cutType.toLowerCase()
  if (!item.stateCondition) return cutType ?? ''
  const stateCondition = item.stateCondition === 'OTHER' ? item.stateConditionOther : item.stateCondition.toLowerCase()
  return [cutType, stateCondition].filter(Boolean).join(', ')
}

export function PrepListPage() {
  const { id } = useParams<{ id: string }>()
  const { data: mealPlan } = useMealPlan(id)
  const { data: prepList, isLoading, isError } = usePrepList(id)

  if (isLoading) return <Loader m="md" />
  if (isError || !prepList) return <Alert color="red" m="md">Could not load prep list.</Alert>

  return (
    <Stack maw={600} mx="auto" p="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Prep List</Title>
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

      {prepList.items.length === 0 ? (
        <Text c="dimmed">Nothing to prep — no produce with a cut type in this meal plan.</Text>
      ) : (
        <Stack gap="lg">
          {[...groupByPrepGroup(prepList.items)].map(([group, items]) => (
            <div key={group}>
              <Title order={4} mb="xs">
                {GROUP_LABELS[group]}
              </Title>
              <List spacing="sm">
                {items.map((item, index) => (
                  <List.Item key={`${item.ingredientId}-${index}`}>
                    {item.toTaste ? (
                      <>
                        {item.ingredientName}
                        <Text span c="dimmed">
                          {' '}
                          — amount not specified
                        </Text>
                      </>
                    ) : (
                      <>
                        {item.amount} {item.unit} {item.ingredientName}
                      </>
                    )}
                    <Text span c="dimmed">
                      {' '}
                      ({describePrep(item)})
                    </Text>
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
