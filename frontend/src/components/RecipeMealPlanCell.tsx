import { useState } from 'react'
import { Anchor, Button, Group, Modal, Select, Stack, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useAddMealPlanItem, useRemoveMealPlanItem } from '../api/mealPlans'
import type { MealPlan } from '../api/types'
import type { RecipeMealPlanAssignment } from '../utils/findRecipeMealPlanAssignments'

interface Props {
  recipeId: number
  recipeName: string
  // Both computed once by the Recipe list for every row up front (see RecipeListPage), rather
  // than each cell independently fetching/re-scanning the full meal plan collection just for
  // its one recipe.
  mealPlans: MealPlan[]
  assignments: RecipeMealPlanAssignment[]
}

// Combines "which meal plan(s) is this recipe already in" and "add it to one" into a single
// Recipe list cell. Each meal plan the recipe is directly in (see
// findRecipeMealPlanAssignments -- menu-only inclusion isn't shown/editable here) renders as
// its own clickable name; clicking it reopens the same modal already scoped to that one
// assignment, so it can be removed or moved to a different plan. When there's no assignment
// at all, an "Add to meal plan" link opens the same modal in plain add mode.
export function RecipeMealPlanCell({ recipeId, recipeName, mealPlans, assignments }: Props) {
  const addMealPlanItem = useAddMealPlanItem()
  const removeMealPlanItem = useRemoveMealPlanItem()

  const [opened, setOpened] = useState(false)
  const [target, setTarget] = useState<RecipeMealPlanAssignment | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)

  const openFor = (assignment: RecipeMealPlanAssignment | null) => {
    setTarget(assignment)
    setSelectedPlanId(assignment ? String(assignment.mealPlanId) : null)
    setOpened(true)
  }

  const close = () => {
    setOpened(false)
    setTarget(null)
    setSelectedPlanId(null)
  }

  const handleRemove = async () => {
    if (!target) return
    try {
      await removeMealPlanItem.mutateAsync({ mealPlanId: target.mealPlanId, itemId: target.itemId })
      notifications.show({ message: `Removed "${recipeName}" from "${target.mealPlanName}".`, color: 'green' })
      close()
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong'
      notifications.show({ message, color: 'red' })
    }
  }

  // Adding to the new plan happens before removing from the old one, so a failure here (e.g.
  // the recipe is already on the target plan) leaves the original assignment untouched rather
  // than losing it.
  const handleSave = async () => {
    if (!selectedPlanId) return
    const newPlanId = Number(selectedPlanId)
    if (target && newPlanId === target.mealPlanId) {
      close()
      return
    }

    const newPlan = mealPlans.find((mp) => mp.id === newPlanId)
    try {
      await addMealPlanItem.mutateAsync({
        mealPlanId: newPlanId,
        item: { itemType: 'RECIPE', recipeId, menuId: null, stapleGroupId: null },
      })
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong'
      notifications.show({ message, color: 'red' })
      return
    }

    if (!target) {
      notifications.show({ message: `Added "${recipeName}" to "${newPlan?.name ?? 'the meal plan'}".`, color: 'green' })
      close()
      return
    }

    try {
      await removeMealPlanItem.mutateAsync({ mealPlanId: target.mealPlanId, itemId: target.itemId })
      notifications.show({
        message: `Moved "${recipeName}" from "${target.mealPlanName}" to "${newPlan?.name ?? 'the meal plan'}".`,
        color: 'green',
      })
      close()
    } catch (err) {
      // The add above already went through -- the recipe is now on BOTH plans, not moved. Say
      // so explicitly rather than a generic error, which would read as "nothing happened" and
      // hide that it's now a duplicate needing manual cleanup. Leave the modal open (rather
      // than close()) so "Remove from this meal plan" is right there to retry.
      const detail = err instanceof ApiRequestError ? err.message : 'Something went wrong'
      notifications.show({
        message: `Added "${recipeName}" to "${newPlan?.name ?? 'the meal plan'}", but couldn't remove it from "${target.mealPlanName}": ${detail}. It's now on both -- remove it from "${target.mealPlanName}" below.`,
        color: 'yellow',
      })
    }
  }

  const isSaving = addMealPlanItem.isPending || removeMealPlanItem.isPending
  const noChangeSelected = target !== null && selectedPlanId === String(target.mealPlanId)

  return (
    <>
      <Group gap={4}>
        {assignments.map((assignment) => (
          <Anchor key={assignment.itemId} size="sm" onClick={() => openFor(assignment)}>
            {assignment.mealPlanName}
          </Anchor>
        ))}
        {assignments.length === 0 && (
          <Anchor size="sm" c="dimmed" onClick={() => openFor(null)}>
            Add to meal plan
          </Anchor>
        )}
      </Group>

      <Modal
        opened={opened}
        onClose={close}
        title={target ? `"${recipeName}" is in "${target.mealPlanName}"` : `Add "${recipeName}" to a meal plan`}
      >
        <Stack>
          {mealPlans.length === 0 ? (
            <Text c="dimmed">No meal plans yet.</Text>
          ) : (
            <Select
              label={target ? 'Move to a different meal plan' : 'Meal plan'}
              placeholder="Choose a meal plan"
              data={mealPlans.map((mp) => ({ value: String(mp.id), label: mp.name }))}
              value={selectedPlanId}
              onChange={setSelectedPlanId}
              searchable
            />
          )}
          <Group justify="space-between">
            {target ? (
              <Button color="red" variant="subtle" onClick={handleRemove} loading={removeMealPlanItem.isPending}>
                Remove from this meal plan
              </Button>
            ) : (
              <span />
            )}
            <Group>
              <Button variant="default" onClick={close}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!selectedPlanId || noChangeSelected} loading={isSaving}>
                {target ? 'Move' : 'Add'}
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
