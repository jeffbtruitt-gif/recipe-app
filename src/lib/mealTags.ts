// A recipe's "type". Stored as an ordinary tag (at most one per recipe) so the
// library filter, category label, and search all work off `recipe_recipes.tags`.
export const MEAL_TAGS = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'drink'];

export function capitalize(value: string): string {
  return value.length ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
