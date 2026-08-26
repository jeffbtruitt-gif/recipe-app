export const MEAL_TAGS = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];

export function capitalize(value: string): string {
  return value.length ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}
