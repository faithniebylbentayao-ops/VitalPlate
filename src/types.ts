export type BodyGoal = 'weight_loss' | 'healthy_gain' | 'maintain' | 'recomp';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete';

export type DietaryPreference =
  | 'balanced'
  | 'mediterranean'
  | 'high_protein'
  | 'vegetarian'
  | 'vegan'
  | 'pescatarian'
  | 'low_carb'
  | 'halal';

export type BiologicalSex = 'female' | 'male';

export type UnitSystem = 'metric' | 'imperial';

export type MealSlot = 'breakfast' | 'lunch' | 'snack' | 'dinner';

export interface UserProfile {
  name: string;
  age: number;
  sex: BiologicalSex;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  bodyGoal: BodyGoal;
  activityLevel: ActivityLevel;
  dietaryPreference: DietaryPreference;
  healthConsiderations: string[];
  mealsPerDay: 3 | 4;
  unitSystem: UnitSystem;
}

export interface MacroTargets {
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterLiters: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

export interface NutritionTargets {
  bmi: number;
  bmiCategory: 'Underweight' | 'Healthy Weight' | 'Overweight' | 'Obesity Class';
  bmiGuidance: string;
  healthyWeightMinKg: number;
  healthyWeightMaxKg: number;
  bmr: number;
  tdee: number;
  dailyCalories: number;
  calorieDelta: number;
  estimatedWeeklyChangeKg: number;
  macros: MacroTargets;
  clinicalNotes: string[];
}

export interface MealIngredient {
  item: string;
  amount: string;
}

export interface RecommendedMeal {
  id: string;
  slot: MealSlot;
  title: string;
  subtitle: string;
  prepMinutes: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  portionGuide: string;
  ingredients: MealIngredient[];
  prepSteps: string[];
  scientificRationale: string;
  keyMicronutrients: string[];
}

export interface DailyMealPlan {
  generatedAt: string;
  planSummary: string;
  hydrationTip: string;
  meals: RecommendedMeal[];
}

export interface LoggedFoodEntry {
  id: string;
  dateKey: string;
  slot: MealSlot;
  title: string;
  portion: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  goalFitNote?: string;
  loggedAt: string;
}

export interface WeightLogEntry {
  dateKey: string;
  weightKg: number;
}
