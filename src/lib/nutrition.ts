import type {
  ActivityLevel,
  BodyGoal,
  DailyMealPlan,
  DietaryPreference,
  NutritionTargets,
  UnitSystem,
  UserProfile,
} from '../types';

export const ACTIVITY_OPTIONS: Array<{
  value: ActivityLevel;
  label: string;
  detail: string;
  multiplier: number;
}> = [
  { value: 'sedentary', label: 'Sedentary', detail: 'Desk work, minimal structured exercise', multiplier: 1.2 },
  { value: 'light', label: 'Lightly Active', detail: '1–2 light workouts or daily walking', multiplier: 1.375 },
  { value: 'moderate', label: 'Moderately Active', detail: '3–4 workouts per week', multiplier: 1.55 },
  { value: 'active', label: 'Very Active', detail: '5–6 intense sessions per week', multiplier: 1.725 },
  { value: 'athlete', label: 'Athlete / Physical Job', detail: 'Daily training or high manual labor', multiplier: 1.9 },
];

export const BODY_GOAL_OPTIONS: Array<{
  value: BodyGoal;
  label: string;
  shortLabel: string;
  detail: string;
}> = [
  {
    value: 'weight_loss',
    label: 'Fat Loss & Metabolic Health',
    shortLabel: 'Weight Loss',
    detail: 'Calibrated deficit with high satiety protein and fiber',
  },
  {
    value: 'healthy_gain',
    label: 'Healthy Weight & Muscle Gain',
    shortLabel: 'Healthy Gain',
    detail: 'Nutrient-dense surplus for underweight recovery or lean mass',
  },
  {
    value: 'maintain',
    label: 'Healthy Weight Maintenance',
    shortLabel: 'Maintain',
    detail: 'Balanced daily energy with diverse micronutrients',
  },
  {
    value: 'recomp',
    label: 'Body Recomposition',
    shortLabel: 'Recomp',
    detail: 'High-protein precision around maintenance energy',
  },
];

export const DIETARY_OPTIONS: Array<{
  value: DietaryPreference;
  label: string;
}> = [
  { value: 'balanced', label: 'Balanced Omnivore' },
  { value: 'mediterranean', label: 'Mediterranean' },
  { value: 'high_protein', label: 'High-Protein Focus' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Plant-Based / Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'low_carb', label: 'Lower-Carb Whole Food' },
  { value: 'halal', label: 'Halal' },
];

export const HEALTH_CONSIDERATION_OPTIONS: string[] = [
  'Insulin Sensitivity / Low GI',
  'Heart-Healthy / Low Sodium',
  'Digestive Gentle / High Fiber',
  'Iron & Bone Density',
  'Dairy-Free',
  'Nut-Free',
  'Gluten-Free',
];

export const PERSONA_PRESETS: Array<{
  id: string;
  label: string;
  summary: string;
  profile: UserProfile;
}> = [
  {
    id: 'weight_loss_coach',
    label: 'Overweight · Steady Loss',
    summary: '34y · 92 kg · High-satiety calorie deficit',
    profile: {
      name: 'Maya',
      age: 34,
      sex: 'female',
      heightCm: 166,
      weightKg: 86,
      targetWeightKg: 68,
      bodyGoal: 'weight_loss',
      activityLevel: 'light',
      dietaryPreference: 'mediterranean',
      healthConsiderations: ['Insulin Sensitivity / Low GI', 'Heart-Healthy / Low Sodium'],
      mealsPerDay: 4,
      unitSystem: 'metric',
    },
  },
  {
    id: 'underweight_gain',
    label: 'Underweight · Healthy Gain',
    summary: '24y · 51 kg · Nutrient-dense calorie surplus',
    profile: {
      name: 'Liam',
      age: 24,
      sex: 'male',
      heightCm: 179,
      weightKg: 54,
      targetWeightKg: 66,
      bodyGoal: 'healthy_gain',
      activityLevel: 'moderate',
      dietaryPreference: 'high_protein',
      healthConsiderations: ['Digestive Gentle / High Fiber'],
      mealsPerDay: 4,
      unitSystem: 'metric',
    },
  },
  {
    id: 'healthy_maintain',
    label: 'Healthy · Longevity Maintain',
    summary: '29y · 65 kg · Balanced energy & recovery',
    profile: {
      name: 'Elena',
      age: 29,
      sex: 'female',
      heightCm: 168,
      weightKg: 63,
      targetWeightKg: 63,
      bodyGoal: 'maintain',
      activityLevel: 'moderate',
      dietaryPreference: 'balanced',
      healthConsiderations: ['Iron & Bone Density'],
      mealsPerDay: 4,
      unitSystem: 'metric',
    },
  },
];

export const DEFAULT_PROFILE: UserProfile = PERSONA_PRESETS[0].profile;

export function calculateNutritionTargets(profile: UserProfile): NutritionTargets {
  const heightM = Math.max(1.2, profile.heightCm / 100);
  const bmiRaw = profile.weightKg / (heightM * heightM);
  const bmi = Math.round(bmiRaw * 10) / 10;

  let bmiCategory: NutritionTargets['bmiCategory'] = 'Healthy Weight';
  let bmiGuidance = 'Current mass sits inside the standard healthy reference band; focus on nutrient quality and metabolic consistency.';

  if (bmi < 18.5) {
    bmiCategory = 'Underweight';
    bmiGuidance = 'Prioritize energy-dense whole foods, steady protein distribution, and progressive nutrient surplus without digestive overload.';
  } else if (bmi < 25) {
    bmiCategory = 'Healthy Weight';
    bmiGuidance = 'Maintain energy equilibrium while optimizing lean tissue support, fiber intake, and micronutrient diversity.';
  } else if (bmi < 30) {
    bmiCategory = 'Overweight';
    bmiGuidance = 'A gentle, sustainable energy deficit anchored around high-satiety protein and soluble fiber preserves lean mass during fat loss.';
  } else {
    bmiCategory = 'Obesity Class';
    bmiGuidance = 'Steady, structured deficit (-450 to -550 kcal/day) paired with low-glycemic whole foods supports metabolic health and joint comfort.';
  }

  const healthyWeightMinKg = Math.round(18.5 * heightM * heightM * 10) / 10;
  const healthyWeightMaxKg = Math.round(24.9 * heightM * heightM * 10) / 10;

  // Mifflin-St Jeor BMR
  const sexOffset = profile.sex === 'male' ? 5 : -161;
  const bmr = Math.round(10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexOffset);

  const activityMeta =
    ACTIVITY_OPTIONS.find((item) => item.value === profile.activityLevel) ?? ACTIVITY_OPTIONS[1];
  const tdee = Math.round(bmr * activityMeta.multiplier);

  let calorieDelta = 0;
  if (profile.bodyGoal === 'weight_loss') {
    calorieDelta = bmi >= 30 ? -500 : bmi >= 25 ? -420 : -320;
  } else if (profile.bodyGoal === 'healthy_gain') {
    calorieDelta = bmi < 18.5 ? 420 : 340;
  } else if (profile.bodyGoal === 'recomp') {
    calorieDelta = -150;
  }

  const minFloor = profile.sex === 'male' ? 1550 : 1320;
  const dailyCalories = Math.max(minFloor, Math.round((tdee + calorieDelta) / 10) * 10);
  const actualDelta = dailyCalories - tdee;
  const estimatedWeeklyChangeKg = Math.round(((actualDelta * 7) / 7700) * 100) / 100;

  // Macro percentages calibrated to body goal, dietary preference & health considerations
  let proteinPct = 0.28;
  let fatPct = 0.28;
  let carbsPct = 0.44;

  if (profile.bodyGoal === 'weight_loss' || profile.bodyGoal === 'recomp') {
    proteinPct = 0.32;
    fatPct = 0.28;
    carbsPct = 0.40;
  } else if (profile.bodyGoal === 'healthy_gain') {
    proteinPct = 0.25;
    fatPct = 0.27;
    carbsPct = 0.48;
  }

  if (profile.dietaryPreference === 'low_carb') {
    carbsPct = 0.24;
    proteinPct = 0.34;
    fatPct = 0.42;
  } else if (profile.dietaryPreference === 'high_protein') {
    proteinPct = Math.max(proteinPct, 0.34);
    carbsPct = 1 - proteinPct - fatPct;
  }

  if (profile.healthConsiderations.includes('Insulin Sensitivity / Low GI')) {
    carbsPct = Math.min(carbsPct, 0.36);
    proteinPct = Math.max(proteinPct, 0.30);
    fatPct = Number((1 - carbsPct - proteinPct).toFixed(2));
  }

  const proteinG = Math.round((dailyCalories * proteinPct) / 4);
  const carbsG = Math.round((dailyCalories * carbsPct) / 4);
  const fatG = Math.round((dailyCalories * fatPct) / 9);
  const fiberG = Math.max(25, Math.round((dailyCalories / 1000) * 14));
  const waterLiters = Math.round((profile.weightKg * 0.033 + (profile.activityLevel === 'active' || profile.activityLevel === 'athlete' ? 0.5 : 0.2)) * 10) / 10;

  const clinicalNotes: string[] = [];
  if (profile.bodyGoal === 'weight_loss') {
    clinicalNotes.push(`Protein anchored at ${proteinG}g/day to preserve lean muscle during fat loss.`);
  } else if (profile.bodyGoal === 'healthy_gain') {
    clinicalNotes.push(`+${Math.abs(actualDelta)} kcal surplus designed for steady ${Math.abs(estimatedWeeklyChangeKg).toFixed(2)} kg/wk lean weight gain.`);
  } else {
    clinicalNotes.push(`Energy matched near ${tdee.toLocaleString()} kcal TDEE for stable weight maintenance.`);
  }

  if (profile.healthConsiderations.includes('Insulin Sensitivity / Low GI')) {
    clinicalNotes.push('Low-glycemic pairing: pairing complex starches with fiber and protein flattens glucose curves.');
  }
  if (profile.healthConsiderations.includes('Heart-Healthy / Low Sodium')) {
    clinicalNotes.push('Cardioprotective profile: emphasizes potassium-rich produce, omega-3 fats, and herbs over added sodium.');
  }
  if (profile.healthConsiderations.includes('Iron & Bone Density')) {
    clinicalNotes.push('Includes heme/non-heme iron paired with vitamin C and calcium-rich whole foods.');
  }

  return {
    bmi,
    bmiCategory,
    bmiGuidance,
    healthyWeightMinKg,
    healthyWeightMaxKg,
    bmr,
    tdee,
    dailyCalories,
    calorieDelta: actualDelta,
    estimatedWeeklyChangeKg,
    macros: {
      proteinG,
      carbsG,
      fatG,
      fiberG,
      waterLiters,
      proteinPct: Math.round(proteinPct * 100),
      carbsPct: Math.round(carbsPct * 100),
      fatPct: Math.round(fatPct * 100),
    },
    clinicalNotes,
  };
}

export function buildBaselinePlan(profile: UserProfile, targets: NutritionTargets): DailyMealPlan {
  const cal = targets.dailyCalories;
  const bCal = Math.round(cal * 0.26);
  const lCal = Math.round(cal * 0.34);
  const sCal = Math.round(cal * 0.12);
  const dCal = Math.max(300, cal - bCal - lCal - sCal);

  const scaleMacro = (mealCal: number, pPct: number, cPct: number, fPct: number) => ({
    proteinG: Math.round((mealCal * pPct) / 4),
    carbsG: Math.round((mealCal * cPct) / 4),
    fatG: Math.round((mealCal * fPct) / 9),
  });

  const dairyFree = profile.healthConsiderations.includes('Dairy-Free');
  const nutFree = profile.healthConsiderations.includes('Nut-Free');
  const glutenFree = profile.healthConsiderations.includes('Gluten-Free');
  const vegan = profile.dietaryPreference === 'vegan';
  const vegetarian = vegan || profile.dietaryPreference === 'vegetarian';

  const bMacros = scaleMacro(bCal, 0.28, 0.44, 0.28);
  const lMacros = scaleMacro(lCal, 0.34, 0.40, 0.26);
  const sMacros = scaleMacro(sCal, 0.26, 0.40, 0.34);
  const dMacros = scaleMacro(dCal, 0.34, 0.36, 0.30);

  return {
    generatedAt: new Date().toISOString(),
    planSummary: `Calibrated ${targets.dailyCalories.toLocaleString()} kcal baseline structured for ${
      BODY_GOAL_OPTIONS.find((g) => g.value === profile.bodyGoal)?.shortLabel ?? 'your goal'
    }. Tap Generate Smart Menu for freshly tailored recipes.`,
    hydrationTip: `Aim for ${targets.macros.waterLiters}L across the day — 400ml on waking and 250ml before main meals.`,
    meals: [
      {
        id: 'baseline-breakfast',
        slot: 'breakfast',
        title: dairyFree || vegan ? 'Chia, Hemp & Berry Protein Oat Bowl' : 'Greek Yogurt, Fig & Toasted Seed Bowl',
        subtitle: 'Slow-release carbohydrates with early-morning protein synthesis support',
        prepMinutes: 8,
        calories: bCal,
        ...bMacros,
        fiberG: 8,
        portionGuide: dairyFree || vegan
          ? '50g rolled oats · 200ml fortified soy milk · 2 tbsp hemp seeds · 80g blueberries'
          : '180g strained Greek yogurt · 35g toasted oats · 1 tbsp pumpkin seeds · 85g berries & fig',
        ingredients: [
          { item: dairyFree || vegan ? 'Unsweetened fortified soy yogurt' : '0–2% plain Greek yogurt', amount: '180 g' },
          { item: glutenFree ? 'Certified GF rolled oats' : 'Whole rolled oats', amount: '35 g' },
          { item: 'Fresh blueberries & sliced fig', amount: '90 g' },
          { item: 'Pumpkin & chia seeds', amount: '18 g' },
        ],
        prepSteps: [
          'Spoon yogurt into a chilled bowl and fold in chia seeds.',
          'Top with toasted oats, pumpkin seeds, fresh blueberries, and sliced fig.',
          'Finish with a pinch of Ceylon cinnamon for gentle glycemic support.',
        ],
        scientificRationale:
          'Starting the day with 25g+ leucine-rich protein and soluble fiber stabilizes morning appetite hormones (GLP-1 & PYY) and prevents mid-morning energy crashes.',
        keyMicronutrients: ['Calcium', 'Anthocyanins', 'Magnesium'],
      },
      {
        id: 'baseline-lunch',
        slot: 'lunch',
        title: vegetarian
          ? 'Herb-Roasted Tofu & Quinoa Harvest Plate'
          : 'Mediterranean Herb Chicken & Quinoa Bowl',
        subtitle: 'Balanced mid-day fuel with roasted sweet potato and tahini greens',
        prepMinutes: 20,
        calories: lCal,
        ...lMacros,
        fiberG: 10,
        portionGuide: vegetarian
          ? '160g firm tofu · 120g cooked quinoa · 100g roasted sweet potato · 2 cups greens'
          : '140g grilled chicken breast · 110g cooked quinoa · 100g sweet potato · baby spinach',
        ingredients: [
          { item: vegetarian ? 'Extra-firm organic tofu' : 'Lean chicken breast (herb-marinated)', amount: vegetarian ? '160 g' : '140 g' },
          { item: 'Cooked tri-color quinoa', amount: '115 g' },
          { item: 'Roasted cubed sweet potato', amount: '100 g' },
          { item: 'Baby spinach, cherry tomatoes & cucumber', amount: '140 g' },
          { item: 'Lemon-garlic tahini dressing', amount: '1.5 tbsp' },
        ],
        prepSteps: [
          'Roast cubed sweet potato and seasoned protein at 200°C for 16 minutes.',
          'Layer cooked quinoa, baby spinach, cucumber, and halved cherry tomatoes.',
          'Top with warm protein and drizzle with lemon-tahini emulsion.',
        ],
        scientificRationale:
          'Combining complete protein with resistant starch in cooled/cooked quinoa and beta-carotene rich sweet potato sustains afternoon cognitive focus without post-lunch fatigue.',
        keyMicronutrients: ['Potassium', 'Beta-Carotene', 'Folate'],
      },
      {
        id: 'baseline-snack',
        slot: 'snack',
        title: nutFree || dairyFree ? 'Steamed Edamame, Apple & Seed Crisps' : 'Crisp Apple, Almond Butter & Edamame Plate',
        subtitle: 'Bridges afternoon hunger with plant protein and crunch',
        prepMinutes: 5,
        calories: sCal,
        ...sMacros,
        fiberG: 6,
        portionGuide: nutFree
          ? '100g shelled edamame · 1 medium crisp apple · 25g sunflower seed butter · seed crackers'
          : '1 crisp apple · 1 tbsp almond butter · 90g steamed edamame · 4 seed crackers',
        ingredients: [
          { item: 'Crisp Honeycrisp or Fuji apple, sliced', amount: '1 medium' },
          { item: nutFree ? 'Sunflower seed butter' : 'Unsalted almond butter', amount: '15 g' },
          { item: 'Steamed edamame pods', amount: '95 g' },
          { item: glutenFree ? 'Buckwheat seed crisps' : 'Whole-grain flax crackers', amount: '25 g' },
        ],
        prepSteps: [
          'Steam edamame pods for 4 minutes with a light pinch of flaky sea salt.',
          'Slice apple and plate alongside seed crackers and unsalted spread.',
        ],
        scientificRationale:
          'Pairing pectin fiber from whole apple with plant isoflavones and monounsaturated fats keeps late-afternoon ghrelin controlled prior to dinner.',
        keyMicronutrients: ['Vitamin E', 'Plant Iron', 'Polyphenols'],
      },
      {
        id: 'baseline-dinner',
        slot: 'dinner',
        title: vegetarian
          ? 'Miso-Glazed Tempeh, Broccoli & Brown Rice Pilaf'
          : 'Pan-Seared Wild Salmon, Broccoli & Herb Rice',
        subtitle: 'Omega-rich recovery dinner with cruciferous vegetables',
        prepMinutes: 22,
        calories: dCal,
        ...dMacros,
        fiberG: 9,
        portionGuide: vegetarian
          ? '150g tempeh · 130g cooked brown rice · 160g tenderstem broccoli & carrots'
          : '150g salmon fillet · 120g lemon herb brown rice · 160g broccoli & carrots',
        ingredients: [
          { item: vegetarian ? 'Fermented soy tempeh' : 'Wild salmon fillet', amount: '150 g' },
          { item: 'Tenderstem broccoli & baby carrots', amount: '170 g' },
          { item: 'Steamed brown rice with parsley & lemon zest', amount: '125 g' },
          { item: 'Extra-virgin olive oil & fresh dill', amount: '1 tsp' },
        ],
        prepSteps: [
          'Sear protein in a light coat of olive oil 3–4 minutes per side until golden.',
          'Steam broccoli and roast carrots until tender-crisp.',
          'Plate alongside lemon-herb brown rice and finish with fresh dill.',
        ],
        scientificRationale:
          'Evening omega-3 fatty acids and sulforaphane from tenderstem broccoli lower systemic inflammation while supporting overnight cellular recovery.',
        keyMicronutrients: ['Omega-3 EPA/DHA', 'Vitamin K', 'Selenium'],
      },
    ],
  };
}

export function formatWeight(kg: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    return `${Math.round(kg * 2.20462 * 10) / 10} lb`;
  }
  return `${Math.round(kg * 10) / 10} kg`;
}

export function formatHeight(cm: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const totalInches = Math.round(cm / 2.54);
    const feet = Math.floor(totalInches / 12);
    const inches = totalInches % 12;
    return `${feet}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}

export function getTodayDateKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getWeekDates(): Array<{ dateKey: string; dayShort: string; dayNum: string; isToday: boolean }> {
  const today = new Date();
  const result: Array<{ dateKey: string; dayShort: string; dayNum: string; isToday: boolean }> = [];
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  for (let offset = -5; offset <= 1; offset++) {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    result.push({
      dateKey: `${y}-${m}-${day}`,
      dayShort: dayLabels[d.getDay()],
      dayNum: String(d.getDate()),
      isToday: offset === 0,
    });
  }
  return result;
}
