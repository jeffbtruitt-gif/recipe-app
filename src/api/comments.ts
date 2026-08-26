import { supabase } from '@/lib/supabase';
import type { Comment } from '@/types/recipe';

export async function listComments(recipeId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('recipe_comments')
    .select('id, recipe_id, body, created_at')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    recipeId: row.recipe_id,
    body: row.body,
    createdAt: row.created_at,
  }));
}

export async function addComment(recipeId: string, body: string): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) return;
  const { error } = await supabase.from('recipe_comments').insert({ recipe_id: recipeId, body: trimmed });
  if (error) throw error;
}

export async function deleteComment(id: string): Promise<void> {
  const { error } = await supabase.from('recipe_comments').delete().eq('id', id);
  if (error) throw error;
}
