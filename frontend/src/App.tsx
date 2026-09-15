import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell, Title } from '@mantine/core'
import { RecipeDetailPage } from './pages/RecipeDetailPage'
import { RecipeFormPage } from './pages/RecipeFormPage'
import { RecipeListPage } from './pages/RecipeListPage'

function App() {
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Title order={3} px="md" py="xs">
          Meal Planner
        </Title>
      </AppShell.Header>
      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/recipes" element={<RecipeListPage />} />
          <Route path="/recipes/new" element={<RecipeFormPage />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default App
