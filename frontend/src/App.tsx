import { Link, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell, Button, Group, Title } from '@mantine/core'
import { BackupPage } from './pages/BackupPage'
import { IngredientFormPage } from './pages/IngredientFormPage'
import { IngredientListPage } from './pages/IngredientListPage'
import { MealPlanDetailPage } from './pages/MealPlanDetailPage'
import { MealPlanFormPage } from './pages/MealPlanFormPage'
import { MealPlanListPage } from './pages/MealPlanListPage'
import { MenuDetailPage } from './pages/MenuDetailPage'
import { MenuFormPage } from './pages/MenuFormPage'
import { MenuListPage } from './pages/MenuListPage'
import { PrepListPage } from './pages/PrepListPage'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipeFormPage } from './pages/RecipeFormPage'
import { RecipeImportPage } from './pages/RecipeImportPage'
import { RecipeListPage } from './pages/RecipeListPage'
import { ShoppingListPage } from './pages/ShoppingListPage'

function App() {
  return (
    <AppShell header={{ height: { base: 140, sm: 56 } }} padding="md">
      <AppShell.Header className="no-print">
        <Group h="100%" px="md" justify="space-between" className="app-header-inner">
          <Title order={3}>Meal Planner</Title>
          <Group gap="xs">
            <Button variant="subtle" component={Link} to="/recipes">
              Recipes
            </Button>
            <Button variant="subtle" component={Link} to="/menus">
              Menus
            </Button>
            <Button variant="subtle" component={Link} to="/meal-plans">
              Meal Plans
            </Button>
            <Button variant="subtle" component={Link} to="/ingredients">
              Ingredients
            </Button>
            <Button variant="subtle" component={Link} to="/backup">
              Backup
            </Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/recipes" element={<RecipeListPage />} />
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
          <Route path="/backup" element={<BackupPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default App
