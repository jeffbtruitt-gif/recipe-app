import { supabase } from '@/lib/supabase';
import type { Recipe, RecipeInput } from '@/types/recipe';

interface RawStep {
  id: string;
  position: number;
  instruction: string;
  timer_label: string | null;
  empty_note: string | null;
  recipe_step_ingredients: { id: string; position: number; amount: string | null; short_name: string }[];
}

interface RawPhase {
  id: string;
  position: number;
  name: string;
  meta: string | null;
  recipe_steps: RawStep[];
}

function toRecipe(row: {
  id: string;
  title: string;
  source_url: string | null;
  description: string | null;
  servings: string | null;
  prep_time: string | null;
  cook_time: string | null;
  total_time: string | null;
  image_url: string | null;
  tags: string[];
  notes: string | null;
  is_favorite: boolean;
  total_minutes: number | null;
  time_note: string | null;
  created_at: string;
  updated_at: string;
  recipe_ingredients: {
    id: string;
    position: number;
    group_label: string | null;
    amount: string | null;
    item: string;
  }[];
  recipe_phases: RawPhase[];
}): Recipe {
  return {
    id: row.id,
    title: row.title,
    sourceUrl: row.source_url,
    description: row.description,
    servings: row.servings,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    totalTime: row.total_time,
    imageUrl: row.image_url,
    tags: row.tags ?? [],
    notes: row.notes,
    isFavorite: row.is_favorite,
    totalMinutes: row.total_minutes,
    timeNote: row.time_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ingredients: [...row.recipe_ingredients]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        id: i.id,
        position: i.position,
        groupLabel: i.group_label,
        amount: i.amount,
        item: i.item,
      })),
    phases: [...row.recipe_phases]
      .sort((a, b) => a.position - b.position)
      .map((phase) => ({
        id: phase.id,
        position: phase.position,
        name: phase.name,
        meta: phase.meta,
        steps: [...phase.recipe_steps]
          .sort((a, b) => a.position - b.position)
          .map((step) => ({
            id: step.id,
            position: step.position,
            instruction: step.instruction,
            timerLabel: step.timer_label,
            emptyNote: step.empty_note,
            sidecar: [...step.recipe_step_ingredients]
              .sort((a, b) => a.position - b.position)
              .map((si) => ({
                id: si.id,
                position: si.position,
                amount: si.amount,
                shortName: si.short_name,
              })),
          })),
      })),
  };
}

const SELECT = `
  id, title, source_url, description, servings, prep_time, cook_time, total_time,
  image_url, tags, notes, is_favorite, total_minutes, time_note, created_at, updated_at,
  recipe_ingredients ( id, position, group_label, amount, item ),
  recipe_phases (
    id, position, name, meta,
    recipe_steps (
      id, position, instruction, timer_label, empty_note,
      recipe_step_ingredients ( id, position, amount, short_name )
    )
  )
`;

export async function listRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipe_recipes')
    .select(SELECT)
    .order('title', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toRecipe);
}

export async function getRecipe(id: string): Promise<Recipe> {
  const { data, error } = await supabase.from('recipe_recipes').select(SELECT).eq('id', id).single();
  if (error) throw error;
  return toRecipe(data);
}

export async function createRecipe(input: RecipeInput): Promise<string> {
  const { data: recipe, error } = await supabase
    .from('recipe_recipes')
    .insert({
      title: input.title.trim(),
      source_url: input.sourceUrl.trim() || null,
      description: input.description.trim() || null,
      servings: input.servings.trim() || null,
      prep_time: input.prepTime.trim() || null,
      cook_time: input.cookTime.trim() || null,
      total_time: input.totalTime.trim() || null,
      image_url: input.imageUrl.trim() || null,
      tags: input.tags,
      notes: input.notes.trim() || null,
      total_minutes: input.totalMinutes.trim() ? Number(input.totalMinutes) : null,
      time_note: input.timeNote.trim() || null,
    })
    .select('id')
    .single();
  if (error) throw error;

  await saveIngredients(recipe.id, input);
  await savePhases(recipe.id, input);
  return recipe.id;
}

export async function updateRecipe(id: string, input: RecipeInput): Promise<void> {
  const { error } = await supabase
    .from('recipe_recipes')
    .update({
      title: input.title.trim(),
      source_url: input.sourceUrl.trim() || null,
      description: input.description.trim() || null,
      servings: input.servings.trim() || null,
      prep_time: input.prepTime.trim() || null,
      cook_time: input.cookTime.trim() || null,
      total_time: input.totalTime.trim() || null,
      image_url: input.imageUrl.trim() || null,
      tags: input.tags,
      notes: input.notes.trim() || null,
      total_minutes: input.totalMinutes.trim() ? Number(input.totalMinutes) : null,
      time_note: input.timeNote.trim() || null,
    })
    .eq('id', id);
  if (error) throw error;

  // Deleting phases cascades to their steps, which cascades to sidecar rows.
  const [{ error: delIngErr }, { error: delPhaseErr }] = await Promise.all([
    supabase.from('recipe_ingredients').delete().eq('recipe_id', id),
    supabase.from('recipe_phases').delete().eq('recipe_id', id),
  ]);
  if (delIngErr) throw delIngErr;
  if (delPhaseErr) throw delPhaseErr;

  await saveIngredients(id, input);
  await savePhases(id, input);
}

async function saveIngredients(recipeId: string, input: RecipeInput): Promise<void> {
  const ingredients = input.ingredients
    .filter((i) => i.item.trim())
    .map((i, index) => ({
      recipe_id: recipeId,
      position: index,
      group_label: i.groupLabel.trim() || null,
      amount: i.amount.trim() || null,
      item: i.item.trim(),
    }));
  if (ingredients.length) {
    const { error } = await supabase.from('recipe_ingredients').insert(ingredients);
    if (error) throw error;
  }
}

async function savePhases(recipeId: string, input: RecipeInput): Promise<void> {
  let stepPosition = 0;
  for (let phaseIndex = 0; phaseIndex < input.phases.length; phaseIndex++) {
    const phase = input.phases[phaseIndex];
    if (!phase.name.trim() && !phase.steps.some((s) => s.instruction.trim())) continue;

    const { data: phaseRow, error: phaseErr } = await supabase
      .from('recipe_phases')
      .insert({
        recipe_id: recipeId,
        position: phaseIndex,
        name: phase.name.trim() || 'Steps',
        meta: phase.meta.trim() || null,
      })
      .select('id')
      .single();
    if (phaseErr) throw phaseErr;

    for (const step of phase.steps) {
      if (!step.instruction.trim()) continue;

      const { data: stepRow, error: stepErr } = await supabase
        .from('recipe_steps')
        .insert({
          recipe_id: recipeId,
          phase_id: phaseRow.id,
          position: stepPosition,
          instruction: step.instruction.trim(),
          timer_label: step.timerLabel.trim() || null,
          empty_note: step.emptyNote.trim() || null,
        })
        .select('id')
        .single();
      if (stepErr) throw stepErr;
      stepPosition += 1;

      const sidecar = step.sidecar
        .filter((si) => si.shortName.trim())
        .map((si, index) => ({
          step_id: stepRow.id,
          position: index,
          amount: si.amount.trim() || null,
          short_name: si.shortName.trim(),
        }));
      if (sidecar.length) {
        const { error: sideErr } = await supabase.from('recipe_step_ingredients').insert(sidecar);
        if (sideErr) throw sideErr;
      }
    }
  }
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipe_recipes').delete().eq('id', id);
  if (error) throw error;
}

export async function setFavorite(id: string, isFavorite: boolean): Promise<void> {
  const { error } = await supabase.from('recipe_recipes').update({ is_favorite: isFavorite }).eq('id', id);
  if (error) throw error;
}

export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const q = query.trim().toLowerCase();
  if (!q) return recipes;
  return recipes.filter((r) => {
    const haystack = [
      r.title,
      r.description ?? '',
      r.notes ?? '',
      ...r.tags,
      ...r.ingredients.map((i) => i.item),
      ...r.phases.flatMap((p) => p.steps.map((s) => s.instruction)),
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}
