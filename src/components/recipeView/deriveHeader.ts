import type { Comment, Recipe } from '@/types/recipe';
import { MEAL_TAGS, capitalize } from '@/lib/mealTags';

export interface DerivedHeader {
  category: string;
  eyebrow: string;
  breadcrumb: string[];
  provenance: string | null;
  phaseCount: number;
}

export function deriveHeader(recipe: Recipe, comments: Comment[] | undefined): DerivedHeader {
  const mealTag = recipe.tags.find((t) => MEAL_TAGS.includes(t.toLowerCase())) ?? null;
  const secondaryTag = recipe.tags.find((t) => t !== mealTag) ?? null;
  const category = mealTag ? capitalize(mealTag) : 'Recipe';
  const eyebrow = secondaryTag ? `${category} · ${capitalize(secondaryTag)}` : category;

  const sourceText = recipe.sourceUrl ? sourceLabel(recipe.sourceUrl) : null;
  const lastCooked = comments && comments.length > 0 ? comments[0].createdAt : null;
  const lastCookedText = lastCooked
    ? `last cooked ${new Date(lastCooked).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`
    : null;
  const provenance = [sourceText, lastCookedText].filter(Boolean).join(' · ') || null;

  return {
    category,
    eyebrow,
    breadcrumb: ['Recipes', category, recipe.title],
    provenance,
    phaseCount: recipe.phases.length,
  };
}

function sourceLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return `Adapted from ${host}`;
  } catch {
    return 'Adapted from an outside source';
  }
}

/** Splits the freeform `notes` field into individual note cards, one per non-empty line. */
export function splitNotes(notes: string | null): string[] {
  if (!notes) return [];
  return notes
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}
