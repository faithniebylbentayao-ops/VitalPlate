import React, { useState } from 'react';
import { Check, ChevronRight, RefreshCw } from 'lucide-react';
import type { DailyMealPlan, LoggedFoodEntry, MealSlot, NutritionTargets, RecommendedMeal, UserProfile } from '../types';
import { BODY_GOAL_OPTIONS } from '../lib/nutrition';
import { MEAL_SLOT_LABELS } from '../lib/mealImages';
import { MealImage } from './MealImage';

interface MealsViewProps {
  profile: UserProfile;
  targets: NutritionTargets;
  plan: DailyMealPlan;
  todayLogs: LoggedFoodEntry[];
  isGeneratingPlan: boolean;
  planError: string | null;
  onGeneratePlan: (focusNote?: string) => void;
  onInspectMeal: (meal: RecommendedMeal) => void;
  onSwapMeal: (meal: RecommendedMeal) => void;
  onLogMeal: (meal: RecommendedMeal) => void;
}

const SLOT_FILTERS: Array<{ value: 'all' | MealSlot; label: string }> = [
  { value: 'all', label: 'Full Day' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'snack', label: 'Snack' },
  { value: 'dinner', label: 'Dinner' },
];

export const MealsView: React.FC<MealsViewProps> = ({
  profile,
  targets,
  plan,
  todayLogs,
  isGeneratingPlan,
  planError,
  onGeneratePlan,
  onInspectMeal,
  onSwapMeal,
  onLogMeal,
}) => {
  const [slotFilter, setSlotFilter] = useState<'all' | MealSlot>('all');
  const [focusInput, setFocusInput] = useState('');

  const loggedSlots = new Set(todayLogs.map((entry) => entry.slot));
  const visibleMeals =
    slotFilter === 'all' ? plan.meals : plan.meals.filter((meal) => meal.slot === slotFilter);

  const totalPlanCalories = plan.meals.reduce((s, m) => s + m.calories, 0);
  const totalPlanProtein = plan.meals.reduce((s, m) => s + m.proteinG, 0);
  const goalLabel = BODY_GOAL_OPTIONS.find((g) => g.value === profile.bodyGoal)?.shortLabel ?? 'Goal';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[#A5B6D4]">
            {goalLabel} · {profile.dietaryPreference.replace('_', ' ')} ·{' '}
            <span className="font-mono tabular-nums text-[#FCD34D]">{totalPlanCalories.toLocaleString()} kcal</span> ·{' '}
            <span className="font-mono tabular-nums text-[#FCD34D]">{totalPlanProtein}g protein</span>
          </p>
          <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight mt-0.5">
            Recommended Menu
          </h1>
        </div>
      </div>

      {/* Menu Calibration Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onGeneratePlan(focusInput.trim() || undefined);
        }}
        className="bg-[#10203E] rounded-2xl border border-[#1E355E] p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <input
          type="text"
          value={focusInput}
          onChange={(e) => setFocusInput(e.target.value)}
          disabled={isGeneratingPlan}
          placeholder="Optional request: e.g. 15-min recipes, warm bowls, budget pantry..."
          className="flex-1 min-h-[44px] px-3.5 rounded-xl bg-[#0C1933] border border-[#233D6B] text-sm text-white placeholder:text-[#6C82A8] focus:outline-none focus:border-[#F5B800]"
        />
        <button
          type="submit"
          disabled={isGeneratingPlan}
          className="min-h-[44px] px-4 rounded-xl bg-[#F5B800] hover:bg-[#FFCA28] disabled:opacity-70 text-[#091428] text-xs font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPlan ? 'animate-spin' : ''}`} />
          {isGeneratingPlan ? 'Crafting Menu...' : 'Generate Smart Menu'}
        </button>
      </form>

      {planError && (
        <div className="rounded-2xl bg-[#2B1218] border border-[#7F1D1D] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-[#FECACA]">{planError}</p>
          <button
            type="button"
            onClick={() => onGeneratePlan(focusInput.trim() || undefined)}
            className="min-h-[44px] px-4 rounded-xl bg-[#DC2626] text-white text-xs font-medium shrink-0"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Segmented Filter Control */}
      <div className="flex items-center gap-1 p-1 bg-[#10203E] border border-[#1E355E] rounded-xl overflow-x-auto no-scrollbar">
        {SLOT_FILTERS.map((item) => {
          const active = slotFilter === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setSlotFilter(item.value)}
              className={`min-h-[40px] flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#F5B800] text-[#091428]'
                  : 'text-[#A5B6D4] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Meal Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleMeals.map((meal) => {
          const isLogged = loggedSlots.has(meal.slot);
          return (
            <article
              key={meal.id}
              className="bg-[#10203E] rounded-3xl border border-[#1E355E] overflow-hidden flex flex-col justify-between"
            >
              <div>
                <button
                  type="button"
                  onClick={() => onInspectMeal(meal)}
                  className="w-full text-left group focus-visible:outline-none"
                >
                  <div className="aspect-[16/10] w-full bg-[#0C1933] overflow-hidden">
                    <MealImage
                      slot={meal.slot}
                      alt={meal.title}
                      className="w-full h-full group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-[#A5B6D4]">
                      <span>
                        {MEAL_SLOT_LABELS[meal.slot]} · {meal.prepMinutes} min
                      </span>
                      <span className="font-mono tabular-nums text-[#FCD34D] font-medium">
                        {meal.calories} kcal · {meal.proteinG}g P · {meal.carbsG}g C · {meal.fatG}g F
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-white mt-1.5 flex items-center justify-between gap-2">
                      <span className="line-clamp-1">{meal.title}</span>
                      <ChevronRight className="w-4 h-4 text-[#A5B6D4] shrink-0" />
                    </h2>
                    <p className="text-xs text-[#A5B6D4] mt-1 line-clamp-2 leading-relaxed">
                      {meal.scientificRationale}
                    </p>
                  </div>
                </button>
              </div>

              <div className="px-4 pb-4 pt-2 flex items-center gap-2 border-t border-[#1E355E] mt-2">
                <button
                  type="button"
                  onClick={() => onInspectMeal(meal)}
                  className="min-h-[44px] px-3.5 rounded-xl border border-[#2B487B] bg-[#0C1933] text-xs font-medium text-white hover:bg-[#172B52] transition-colors whitespace-nowrap"
                >
                  Recipe
                </button>
                <button
                  type="button"
                  onClick={() => onSwapMeal(meal)}
                  className="min-h-[44px] px-3.5 rounded-xl border border-[#2B487B] bg-[#0C1933] text-xs font-medium text-[#A5B6D4] hover:text-white hover:bg-[#172B52] transition-colors flex items-center gap-1.5 whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Swap
                </button>
                <button
                  type="button"
                  onClick={() => onLogMeal(meal)}
                  className={`min-h-[44px] px-4 rounded-xl text-xs font-semibold transition-transform active:scale-[0.98] ml-auto flex items-center gap-1.5 whitespace-nowrap ${
                    isLogged
                      ? 'bg-[#172B52] text-[#FCD34D] border border-[#F5B800]/40'
                      : 'bg-[#F5B800] text-[#091428] hover:bg-[#FFCA28]'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  {isLogged ? 'Logged' : 'Log'}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Clinical Note Footer */}
      <div className="bg-[#10203E] rounded-2xl border border-[#1E355E] p-4 space-y-1.5">
        <p className="text-xs font-semibold text-[#FCD34D]">Nutritional Rationale Summary</p>
        {targets.clinicalNotes.map((note, idx) => (
          <p key={idx} className="text-xs text-[#DCE4F2] leading-relaxed">
            · {note}
          </p>
        ))}
      </div>
    </div>
  );
};
