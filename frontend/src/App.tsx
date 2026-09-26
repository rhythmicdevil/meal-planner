import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell, Button, Group, Menu, Title } from '@mantine/core'
import { BackupPage } from './pages/BackupPage'
import { HelpPage } from './pages/HelpPage'
import { IngredientFormPage } from './pages/IngredientFormPage'
import { IngredientListPage } from './pages/IngredientListPage'
import { MealPlanDetailPage } from './pages/MealPlanDetailPage'
import { MealPlanFormPage } from './pages/MealPlanFormPage'
import { MealPlanListPage } from './pages/MealPlanListPage'
import { MenuDetailPage } from './pages/MenuDetailPage'
import { MenuFormPage } from './pages/MenuFormPage'
import { MenuListPage } from './pages/MenuListPage'
import { PrepListPage } from './pages/PrepListPage'
import { RecipeBookPage } from './pages/RecipeBookPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipeFormPage } from './pages/RecipeFormPage'
import { RecipeImportPage } from './pages/RecipeImportPage'
import { RecipeListPage } from './pages/RecipeListPage'
import { ShoppingListPage } from './pages/ShoppingListPage'
import { StapleGroupDetailPage } from './pages/StapleGroupDetailPage'
import { StapleGroupFormPage } from './pages/StapleGroupFormPage'
import { StapleGroupListPage } from './pages/StapleGroupListPage'
import { StoreFormPage } from './pages/StoreFormPage'
import { StoreListPage } from './pages/StoreListPage'

function App() {
  return (
    <AppShell header={{ height: { base: 110, sm: 56 } }} padding="md">
      <AppShell.Header className="no-print">
        <Group h="100%" px="md" justify="space-between" className="app-header-inner">
          <Title order={3}>Meal Planner</Title>
          <Group gap="xs">
            <Menu shadow="md" position="bottom-start">
              <Menu.Target>
                <Button variant="subtle">Recipes</Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item component={Link} to="/recipes">
                  All Recipes
                </Menu.Item>
                <Menu.Item component={Link} to="/recipes/book">
                  Recipe Book
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
            <Button variant="subtle" component={Link} to="/meal-plans">
              Meal Plans
            </Button>
            <Button variant="subtle" component={Link} to="/staple-groups">
              Staples
            </Button>
            <Menu shadow="md" position="bottom-end">
              <Menu.Target>
                <Button variant="subtle">More</Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item component={Link} to="/menus">
                  Menus
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item component={Link} to="/ingredients">
                  Ingredients
                </Menu.Item>
                <Menu.Item component={Link} to="/stores">
                  Stores
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item component={Link} to="/backup">
                  Backup
                </Menu.Item>
                <Menu.Item component={Link} to="/help">
                  Help
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/recipes" element={<RecipeListPage />} />
          <Route path="/recipes/book" element={<RecipeBookPage />} />
          <Route path="/recipes/new" element={<RecipeFormPage />} />
          <Route path="/recipes/import" element={<RecipeImportPage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
          <Route path="/menus" element={<MenuListPage />} />
          <Route path="/menus/new" element={<MenuFormPage />} />
          <Route path="/menus/:id" element={<MenuDetailPage />} />
          <Route path="/menus/:id/edit" element={<MenuFormPage />} />
          <Route path="/meal-plans" element={<MealPlanListPage />} />
          <Route path="/meal-plans/new" element={<MealPlanFormPage />} />
          <Route path="/meal-plans/:id" element={<MealPlanDetailPage />} />
          <Route path="/meal-plans/:id/edit" element={<MealPlanFormPage />} />
          <Route path="/meal-plans/:id/shopping-list" element={<ShoppingListPage />} />
          <Route path="/meal-plans/:id/prep-list" element={<PrepListPage />} />
          <Route path="/ingredients" element={<IngredientListPage />} />
          <Route path="/ingredients/new" element={<IngredientFormPage />} />
          <Route path="/ingredients/:id/edit" element={<IngredientFormPage />} />
          <Route path="/staple-groups" element={<StapleGroupListPage />} />
          <Route path="/staple-groups/new" element={<StapleGroupFormPage />} />
          <Route path="/staple-groups/:id" element={<StapleGroupDetailPage />} />
          <Route path="/staple-groups/:id/edit" element={<StapleGroupFormPage />} />
          <Route path="/stores" element={<StoreListPage />} />
          <Route path="/stores/new" element={<StoreFormPage />} />
          <Route path="/stores/:id/edit" element={<StoreFormPage />} />
          <Route path="/backup" element={<BackupPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default App
