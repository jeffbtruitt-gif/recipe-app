import { Routes, Route, Link, Outlet } from 'react-router-dom';
import RecipeLibraryPage from '@/pages/RecipeLibraryPage';
import RecipeDetailPage from '@/pages/RecipeDetailPage';
import RecipeFormPage from '@/pages/RecipeFormPage';

function AppLayout() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-clay/20 bg-cream/90 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <Link to="/" className="font-serif text-2xl text-clayDark tracking-tight">
            Thaw and Order
          </Link>
          <Link
            to="/recipes/new"
            className="rounded-full bg-clay px-4 py-2 text-sm font-medium text-cream hover:bg-clayDark transition-colors"
          >
            + Add Recipe
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* The library and recipe-view pages own their full-bleed chrome
          (sticky top bar, background, card) per the design handoffs, so
          they render outside the standard app header/container. The
          add/edit form isn't redesigned yet and keeps the original layout. */}
      <Route path="/" element={<RecipeLibraryPage />} />
      <Route path="/recipes/:id" element={<RecipeDetailPage />} />
      <Route element={<AppLayout />}>
        <Route path="/recipes/new" element={<RecipeFormPage mode="create" />} />
        <Route path="/recipes/:id/edit" element={<RecipeFormPage mode="edit" />} />
      </Route>
    </Routes>
  );
}
