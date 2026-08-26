import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getRecipe } from '@/api/recipes';
import { listComments } from '@/api/comments';
import { deriveHeader } from '@/components/recipeView/deriveHeader';
import { useIsDesktop } from '@/lib/useIsDesktop';
import DesktopRecipeView from '@/components/recipeView/DesktopRecipeView';
import MobileRecipeView from '@/components/recipeView/MobileRecipeView';

export default function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isDesktop = useIsDesktop(900);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const { data: recipe, isLoading, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipe(id!),
    enabled: !!id,
  });

  const { data: comments } = useQuery({
    queryKey: ['recipe-comments', id],
    queryFn: () => listComments(id!),
    enabled: !!id,
  });

  const derived = useMemo(() => (recipe ? deriveHeader(recipe, comments) : null), [recipe, comments]);

  function toggleStep(stepId: string) {
    setDone((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading…
      </div>
    );
  }
  if (error || !recipe || !derived) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Recipe not found.
      </div>
    );
  }

  return isDesktop ? (
    <DesktopRecipeView recipe={recipe} derived={derived} done={done} onToggleStep={toggleStep} />
  ) : (
    <MobileRecipeView recipe={recipe} derived={derived} done={done} onToggleStep={toggleStep} />
  );
}
