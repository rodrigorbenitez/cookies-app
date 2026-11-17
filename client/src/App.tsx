import { Route, Routes } from 'react-router';
import { Layout } from './components/Layout';
import { RecipeListPage } from './pages/RecipeListPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { RecipeFormPage } from './pages/RecipeFormPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { SettingsPage } from './pages/SettingsPage';
import { CookingModePage } from './pages/CookingModePage';

export function App() {
  return (
    <Routes>
      <Route path="/recipes/:id/cook" element={<CookingModePage />} />
      <Route element={<Layout />}>
        <Route index element={<RecipeListPage />} />
        <Route path="/recipes/new" element={<RecipeFormPage />} />
        <Route path="/recipes/:id" element={<RecipeDetailPage />} />
        <Route path="/recipes/:id/edit" element={<RecipeFormPage />} />
        <Route path="/shopping" element={<ShoppingListPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="*"
          element={<p className="py-20 text-center text-stone-500">This page does not exist.</p>}
        />
      </Route>
    </Routes>
  );
}
