import type { MealSlot } from '../types';

export const MEAL_SLOT_IMAGES: Record<MealSlot, string> = {
  breakfast: '/src/assets/images/meal_breakfast_1795174790165.jpg',
  lunch: '/src/assets/images/meal_lunch_1795174790845.jpg',
  snack: '/src/assets/images/meal_snack_1795174790820.jpg',
  dinner: '/src/assets/images/meal_dinner_1795174790853.jpg',
};

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Afternoon Snack',
  dinner: 'Dinner',
};
