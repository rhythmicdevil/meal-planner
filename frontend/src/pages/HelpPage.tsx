import { Stack, Text, Title } from '@mantine/core'

export function HelpPage() {
  return (
    <Stack maw={700} mx="auto" py="lg" px="md">
      <Title order={2}>Help</Title>

      <Title order={4}>Ingredients</Title>
      <Text>
        The master catalog of everything used in recipes — name, category (used to group the
        shopping list by aisle), optional aliases, and a default unit. The "Orphaned
        Ingredients" button on the ingredient list finds ones no recipe uses, so you can clean
        them up in bulk.
      </Text>

      <Title order={4}>Recipes</Title>
      <Text>
        Create a recipe by hand, or import one from a URL. Ingredient lines can be pasted in
        bulk — amount, unit, name, and prep style (chopped, diced, etc.) are parsed
        automatically, and new catalog ingredients are created as needed.
      </Text>

      <Title order={4}>Menus</Title>
      <Text>
        A named, reusable collection of recipes (e.g. "Taco Night"). Add the whole menu to a
        meal plan at once instead of picking its recipes one by one.
      </Text>

      <Title order={4}>Staple Groups</Title>
      <Text>
        A named collection of things you buy every week regardless of what's cooking — cleaning
        supplies, paper products, personal care, etc. An item can optionally link to an existing
        ingredient (e.g. bananas), so it won't show up twice on the shopping list if a recipe
        also needs it that week.
      </Text>

      <Title order={4}>Meal Plans</Title>
      <Text>
        Combine recipes, menus, and staple groups for a stretch of time. This is what the
        shopping list and prep list below are generated from.
      </Text>

      <Title order={4}>Shopping List</Title>
      <Text>
        Generated from a meal plan: ingredient amounts are combined across recipes and grouped
        by grocery category, with a separate Staples section grouped by staple group. Tap or
        click an item to cross it off — it's remembered on this device. Printable, two-column
        layout.
      </Text>

      <Title order={4}>Prep List</Title>
      <Text>
        Generated from a meal plan: produce that needs prepping ahead of time (chopped, diced,
        etc.), combined across recipes.
      </Text>

      <Title order={4}>Backup</Title>
      <Text>
        Export downloads a full backup of your data. Restore uploads a previously exported file
        and replaces all current data with it.
      </Text>
    </Stack>
  )
}
