import { Button, Group, Paper, Select, Stack } from '@mantine/core'
import type { UseFormReturnType } from '@mantine/form'
import { useMenus } from '../api/menus'
import { useRecipes } from '../api/recipes'
import { useStapleGroups } from '../api/stapleGroups'
import type { MealPlanItemType } from '../api/types'
import { emptyMealPlanItemRow, type MealPlanFormValues } from '../types/mealPlanForm'

interface Props {
  form: UseFormReturnType<MealPlanFormValues>
}

const ITEM_TYPES = [
  { value: 'RECIPE', label: 'Recipe' },
  { value: 'MENU', label: 'Menu' },
  { value: 'STAPLE_GROUP', label: 'Staple Group' },
]

export function MealPlanItemsEditor({ form }: Props) {
  const { data: recipes = [] } = useRecipes()
  const { data: menus = [] } = useMenus()
  const { data: stapleGroups = [] } = useStapleGroups()
  const rows = form.values.items

  return (
    <Stack>
      {rows.map((row, index) => (
        <Paper key={index} withBorder p="sm">
          <Stack gap="xs">
            <Group grow align="flex-start">
              <Select
                label="Type"
                data={ITEM_TYPES}
                allowDeselect={false}
                value={row.itemType}
                onChange={(value) => {
                  if (!value) return
                  form.setFieldValue(`items.${index}.itemType`, value as MealPlanItemType)
                  form.setFieldValue(`items.${index}.recipeId`, null)
                  form.setFieldValue(`items.${index}.menuId`, null)
                  form.setFieldValue(`items.${index}.stapleGroupId`, null)
                }}
              />
              {row.itemType === 'RECIPE' && (
                <Select
                  label="Recipe"
                  placeholder="Search recipes…"
                  searchable
                  data={recipes.map((recipe) => ({ value: String(recipe.id), label: recipe.name }))}
                  {...form.getInputProps(`items.${index}.recipeId`)}
                />
              )}
              {row.itemType === 'MENU' && (
                <Select
                  label="Menu"
                  placeholder="Search menus…"
                  searchable
                  data={menus.map((menu) => ({ value: String(menu.id), label: menu.name }))}
                  {...form.getInputProps(`items.${index}.menuId`)}
                />
              )}
              {row.itemType === 'STAPLE_GROUP' && (
                <Select
                  label="Staple Group"
                  placeholder="Search staple groups…"
                  searchable
                  data={stapleGroups.map((stapleGroup) => ({ value: String(stapleGroup.id), label: stapleGroup.name }))}
                  {...form.getInputProps(`items.${index}.stapleGroupId`)}
                />
              )}
            </Group>
            <Button
              color="red"
              variant="subtle"
              type="button"
              onClick={() => form.removeListItem('items', index)}
            >
              Remove
            </Button>
          </Stack>
        </Paper>
      ))}
      <Button
        variant="light"
        type="button"
        onClick={() => form.insertListItem('items', emptyMealPlanItemRow())}
      >
        + Add item
      </Button>
    </Stack>
  )
}
