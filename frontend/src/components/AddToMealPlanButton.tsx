import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Anchor, Button, type ButtonProps, Group, Modal, Select, Stack, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { ApiRequestError } from '../api/client'
import { useAddMealPlanItem, useMealPlans } from '../api/mealPlans'
import { findRecipeMealPlanAssignments } from '../utils/findRecipeMealPlanAssignments'

interface AddToMealPlanButtonProps extends Pick<ButtonProps, 'variant' | 'size'> {
  recipeId: number
  recipeName: string
}

// Lets a recipe be added to an existing meal plan directly from the Recipe list or detail
// view, instead of only being reachable by opening that meal plan's own edit form. Reused
// in both places since the "pick a plan, add" flow is identical either way.
export function AddToMealPlanButton({ recipeId, recipeName, variant = 'default', size }: AddToMealPlanButtonProps) {
  const [opened, setOpened] = useState(false)
  const [mealPlanId, setMealPlanId] = useState<string | null>(null)
  const { data: mealPlans } = useMealPlans()
  const addMealPlanItem = useAddMealPlanItem()
  // Same "is this recipe already a direct RECIPE item on this plan" check RecipeMealPlanCell
  // uses, via the shared/tested utility rather than a separately-maintained re-derivation of
  // it here.
  const alreadyAddedPlanIds = new Set(
    findRecipeMealPlanAssignments(recipeId, mealPlans ?? []).map((assignment) => assignment.mealPlanId),
  )

  const close = () => {
    setOpened(false)
    setMealPlanId(null)
  }

  const handleAdd = async () => {
    if (!mealPlanId) return
    const mealPlan = mealPlans?.find((mp) => mp.id === Number(mealPlanId))
    try {
      await addMealPlanItem.mutateAsync({
        mealPlanId,
        item: { itemType: 'RECIPE', recipeId, menuId: null, stapleGroupId: null },
      })
      notifications.show({
        message: `Added "${recipeName}" to ${mealPlan ? `"${mealPlan.name}"` : 'the meal plan'}.`,
        color: 'green',
      })
      close()
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong'
      notifications.show({ message, color: 'red' })
    }
  }

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpened(true)}>
        Add to Meal Plan
      </Button>

      <Modal opened={opened} onClose={close} title={`Add "${recipeName}" to a meal plan`}>
        <Stack>
          {mealPlans && mealPlans.length === 0 ? (
            <Text c="dimmed">
              No meal plans yet —{' '}
              <Anchor component={Link} to="/meal-plans/new" onClick={close}>
                create one first
              </Anchor>
              .
            </Text>
          ) : (
            <Select
              label="Meal plan"
              placeholder="Choose a meal plan"
              data={(mealPlans ?? []).map((mp) => {
                const alreadyAdded = alreadyAddedPlanIds.has(mp.id)
                return {
                  value: String(mp.id),
                  label: alreadyAdded ? `${mp.name} (already added)` : mp.name,
                  disabled: alreadyAdded,
                }
              })}
              value={mealPlanId}
              onChange={setMealPlanId}
              searchable
            />
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!mealPlanId} loading={addMealPlanItem.isPending}>
              Add
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
