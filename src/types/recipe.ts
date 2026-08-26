export interface Ingredient {
  id: string;
  position: number;
  groupLabel: string | null;
  amount: string | null;
  item: string;
}

export interface StepIngredient {
  id: string;
  position: number;
  amount: string | null;
  shortName: string;
}

export interface Step {
  id: string;
  position: number;
  instruction: string;
  timerLabel: string | null;
  emptyNote: string | null;
  sidecar: StepIngredient[];
}

export interface Phase {
  id: string;
  position: number;
  name: string;
  meta: string | null;
  steps: Step[];
}

export interface Comment {
  id: string;
  recipeId: string;
  body: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  sourceUrl: string | null;
  description: string | null;
  servings: string | null;
  prepTime: string | null;
  cookTime: string | null;
  totalTime: string | null;
  imageUrl: string | null;
  tags: string[];
  notes: string | null;
  isFavorite: boolean;
  totalMinutes: number | null;
  timeNote: string | null;
  createdAt: string;
  updatedAt: string;
  ingredients: Ingredient[];
  phases: Phase[];
}

export interface RecipeInput {
  title: string;
  sourceUrl: string;
  description: string;
  servings: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  imageUrl: string;
  tags: string[];
  notes: string;
  totalMinutes: string;
  timeNote: string;
  ingredients: { groupLabel: string; amount: string; item: string }[];
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

export const emptyRecipeInput: RecipeInput = {
  title: '',
  sourceUrl: '',
  description: '',
  servings: '',
  prepTime: '',
  cookTime: '',
  totalTime: '',
  imageUrl: '',
  tags: [],
  notes: '',
  totalMinutes: '',
  timeNote: '',
  ingredients: [{ groupLabel: '', amount: '', item: '' }],
  phases: [
    {
      name: '',
      meta: '',
      steps: [{ instruction: '', timerLabel: '', emptyNote: '', sidecar: [{ amount: '', shortName: '' }] }],
    },
  ],
};
