import { createRecipe } from '@/api/recipes';
import type { RecipeInput } from '@/types/recipe';

const PASSCODE_KEY = 'thaw-import-passcode';

export function getSavedPasscode(): string {
  try {
    return localStorage.getItem(PASSCODE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function savePasscode(passcode: string): void {
  try {
    localStorage.setItem(PASSCODE_KEY, passcode);
  } catch {
    /* storage unavailable — user just re-enters it next time */
  }
}

export function clearPasscode(): void {
  try {
    localStorage.removeItem(PASSCODE_KEY);
  } catch {
    /* ignore */
  }
}

export class ImportError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

interface ParsedRecipe {
  title: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  totalMinutes: number | null;
  timeNote: string;
  meal: string;
  tags: string[];
  notes: string;
  ingredients: { amount: string; item: string }[];
  phases: {
    name: string;
    meta: string;
    steps: {
      instruction: string;
      timerLabel: string;
      emptyNote: string;
      sidecar: { amount: string; shortName: string }[];
    }[];
  }[];
}

function toInput(parsed: ParsedRecipe, sourceUrl: string): RecipeInput {
  const meal = parsed.meal.toLowerCase();
  const tags = [meal, ...new Set(parsed.tags.map((t) => t.trim().toLowerCase()).filter((t) => t && t !== meal))];
  return {
    title: parsed.title,
    sourceUrl,
    description: parsed.description,
    servings: parsed.servings,
    prepTime: parsed.prepTime,
    cookTime: parsed.cookTime,
    totalTime: parsed.totalTime,
    imageUrl: '',
    tags,
    notes: parsed.notes,
    totalMinutes: parsed.totalMinutes != null ? String(parsed.totalMinutes) : '',
    timeNote: parsed.timeNote,
    ingredients: parsed.ingredients.map((i) => ({ groupLabel: '', amount: i.amount, item: i.item })),
    phases: parsed.phases.map((p) => ({
      name: p.name,
      meta: p.meta,
      steps: p.steps.map((s) => ({
        instruction: s.instruction,
        timerLabel: s.timerLabel,
        emptyNote: s.emptyNote,
        sidecar: s.sidecar.map((si) => ({ amount: si.amount, shortName: si.shortName })),
      })),
    })),
  };
}

/** Sends pasted text or a link to the parse-recipe Edge Function, saves the result, and returns the new recipe's id. */
export async function importRecipe(text: string, passcode: string): Promise<string> {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-recipe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, passcode }),
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    recipe?: ParsedRecipe;
    sourceUrl?: string;
  };
  if (!res.ok || !body.recipe) {
    throw new ImportError(body.error ?? 'Something went wrong importing that recipe.', res.status);
  }

  return createRecipe(toInput(body.recipe, body.sourceUrl ?? ''));
}
