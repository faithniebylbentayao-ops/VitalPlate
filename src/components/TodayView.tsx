import React from 'react';
import { ArrowRight, Check, Droplets, RefreshCw, SlidersHorizontal } from 'lucide-react';
import type { DailyMealPlan, LoggedFoodEntry, NutritionTargets, RecommendedMeal, UserProfile } from '../types';
import { BODY_GOAL_OPTIONS, formatWeight } from '../lib/nutrition';
import { MEAL_SLOT_LABELS } from '../lib/mealImages';
import { MacroRing } from './MacroRing';
import { MealImage } from './MealImage';

interface TodayViewProps {
  profile: UserProfile;
  targets: NutritionTargets;
  plan: DailyMealPlan;
  todayLogs: LoggedFoodEntry[];
  waterMl: number;
  isGeneratingPlan: boolean;
  planError: string | null;
  onAddWater: (ml: number) => void;
  onLogMeal: (meal: RecommendedMeal) => void;
  onInspectMeal: (meal: RecommendedMeal) => void;
  onGeneratePlan: () => void;
  onNavigateTab: (tab: 'today' | 'meals' | 'tracker' | 'profile') => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  profile,
  targets,
  plan,
  todayLogs,
  waterMl,
  isGeneratingPlan,
  planError,
  onAddWater,
  onLogMeal,
  onInspectMeal,
  onGeneratePlan,
  onNavigateTab,
}) => {
  const consumedCalories = todayLogs.reduce((acc, item) => acc + item.calories, 0);
  const consumedProtein = todayLogs.reduce((acc, item) => acc + item.proteinG, 0);
  const consumedCarbs = todayLogs.reduce((acc, item) => acc + item.carbsG, 0);
  const consumedFat = todayLogs.reduce((acc, item) => acc + item.fatG, 0);

  const loggedSlots = new Set(todayLogs.map((l) => l.slot));
  const nextMeal = plan.meals.find((m) => !loggedSlots.has(m.slot)) ?? plan.meals[0];
  const goalOption = BODY_GOAL_OPTIONS.find((g) => g.value === profile.bodyGoal);

  const waterTargetMl = Math.round(targets.macros.waterLiters * 1000);
  const waterPct = Math.min(100, Math.round((waterMl / waterTargetMl) * 100));

  const macroRows = [
    {
      label: 'Protein',
      current: consumedProtein,
      target: targets.macros.proteinG,
      color: 'bg-[#F5B800]',
    },
    {
      label: 'Carbohydrates',
      current: consumedCarbs,
      target: targets.macros.carbsG,
      color: 'bg-[#60A5FA]',
    },
    {
      label: 'Healthy Fats',
      current: consumedFat,
      target: targets.macros.fatG,
      color: 'bg-[#CBD5E1]',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Greeting & Goal Overview */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#A5B6D4]">
            {profile.name} · {goalOption?.shortLabel ?? 'Personalized Goal'}
          </p>
          <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight mt-0.5">
            Daily Nutrition Plan
          </h1>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('profile')}
          className="min-h-[44px] px-3.5 rounded-xl border border-[#233D6B] bg-[#10203E] text-xs font-medium text-[#FCD34D] hover:bg-[#172B52] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#FCD34D]" />
          Adjust Profile
        </button>
      </div>

      {planError && (
        <div className="rounded-2xl bg-[#2B1218] border border-[#7F1D1D] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-[#FECACA]">{planError}</p>
          <button
            type="button"
            onClick={onGeneratePlan}
            className="min-h-[44px] px-4 rounded-xl bg-[#DC2626] text-white text-xs font-medium shrink-0"
          >
            Retry Generation
          </button>
        </div>
      )}

      {/* Primary Dashboard Split on Desktop / Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Focal Anchor: Energy Ring & Macro Targets */}
        <section className="lg:col-span-7 bg-[#10203E] rounded-3xl border border-[#1E355E] p-5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex items-center gap-5">
              <MacroRing
                value={consumedCalories}
                target={targets.dailyCalories}
                size={124}
                strokeWidth={10}
                label="Daily Energy"
              />
              <div>
                <p className="text-xs font-medium text-[#A5B6D4]">Daily Energy Budget</p>
                <p className="font-mono text-2xl font-semibold text-white tabular-nums mt-0.5">
                  {targets.dailyCalories.toLocaleString()}
                  <span className="text-xs font-normal text-[#A5B6D4] ml-1">kcal</span>
                </p>
                <p className="text-xs text-[#A5B6D4] mt-1 tabular-nums">
                  {consumedCalories.toLocaleString()} kcal logged · {todayLogs.length}{' '}
                  {todayLogs.length === 1 ? 'meal' : 'meals'}
                </p>
              </div>
            </div>

            <div className="sm:ml-auto flex sm:flex-col justify-between sm:items-end gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#1E355E]">
              <div>
                <p className="text-xs text-[#A5B6D4]">BMI Index</p>
                <p className="font-mono text-base font-semibold text-white tabular-nums">
                  {targets.bmi.toFixed(1)} · {targets.bmiCategory}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-[#A5B6D4]">Target Pace</p>
                <p className="font-mono text-sm font-semibold text-[#FCD34D] tabular-nums">
                  {targets.calorieDelta === 0
                    ? 'Maintenance equilibrium'
                    : `${targets.calorieDelta > 0 ? '+' : ''}${targets.calorieDelta} kcal/day`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#1E355E] space-y-3">
            {macroRows.map((macro) => {
              const pct = macro.target > 0 ? Math.min(100, Math.round((macro.current / macro.target) * 100)) : 0;
              return (
                <div key={macro.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-[#E2E9F5]">{macro.label}</span>
                    <span className="font-mono text-[#A5B6D4] tabular-nums">
                      <strong className="text-white font-semibold">{macro.current}g</strong> / {macro.target}g
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#0C1933] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${macro.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Body Status & Hydration */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#10203E] rounded-3xl border border-[#1E355E] p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-white">Scientific Assessment</h2>
                <span className="font-mono text-xs text-[#FCD34D] tabular-nums">
                  {formatWeight(profile.weightKg, profile.unitSystem)} →{' '}
                  {formatWeight(profile.targetWeightKg, profile.unitSystem)}
                </span>
              </div>
              <p className="text-sm text-[#DCE4F2] mt-2 leading-relaxed">{targets.bmiGuidance}</p>
              <p className="text-xs text-[#A5B6D4] mt-2.5 leading-relaxed">
                {plan.planSummary}
              </p>
            </div>

            <div className="mt-4 pt-3.5 border-t border-[#1E355E] flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[#A5B6D4]">Healthy Reference Range</p>
                <p className="font-mono text-sm font-semibold text-white tabular-nums">
                  {formatWeight(targets.healthyWeightMinKg, profile.unitSystem)} –{' '}
                  {formatWeight(targets.healthyWeightMaxKg, profile.unitSystem)}
                </p>
              </div>
              <button
                type="button"
                disabled={isGeneratingPlan}
                onClick={onGeneratePlan}
                className="min-h-[44px] px-4 rounded-xl bg-[#F5B800] hover:bg-[#FFCA28] disabled:opacity-70 text-[#091428] text-xs font-semibold transition-all active:scale-[0.98] flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPlan ? 'animate-spin' : ''}`} />
                {isGeneratingPlan ? 'Personalizing...' : 'Generate Smart Menu'}
              </button>
            </div>
          </div>

          <div className="bg-[#10203E] rounded-3xl border border-[#1E355E] p-4 flex items-center justify-between gap-4 text-white">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#FCD34D]">
                <Droplets className="w-3.5 h-3.5 shrink-0" />
                <span>Hydration Target · {waterPct}%</span>
              </div>
              <p className="font-mono text-base font-semibold text-white tabular-nums mt-0.5">
                {(waterMl / 1000).toFixed(2)} L{' '}
                <span className="text-xs font-normal text-[#A5B6D4]">/ {targets.macros.waterLiters} L</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAddWater(250)}
              className="min-h-[44px] px-4 rounded-xl bg-[#F5B800] hover:bg-[#FFCA28] text-[#091428] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              + 250 ml
            </button>
          </div>
        </section>
      </div>

      {/* Next Recommended Meal Spotlight */}
      {nextMeal && (
        <section className="bg-[#10203E] rounded-3xl border border-[#1E355E] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
            <div className="md:col-span-5 aspect-[4/3] md:aspect-auto md:min-h-[220px] bg-[#0C1933]">
              <MealImage slot={nextMeal.slot} alt={nextMeal.title} className="w-full h-full" />
            </div>
            <div className="md:col-span-7 p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between gap-2 text-xs text-[#A5B6D4]">
                  <span>
                    Up Next · {MEAL_SLOT_LABELS[nextMeal.slot]} · {nextMeal.prepMinutes} min
                  </span>
                  <span className="font-mono tabular-nums text-[#FCD34D] font-medium">
                    {nextMeal.calories} kcal · {nextMeal.proteinG}g P
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1.5 leading-snug">{nextMeal.title}</h2>
                <p className="text-sm text-[#A5B6D4] mt-1">{nextMeal.subtitle}</p>
                <p className="text-xs text-[#E2E9F5] mt-3 leading-relaxed bg-[#16294D] rounded-xl p-3 border border-[#F5B800]/30">
                  {nextMeal.scientificRationale}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => onInspectMeal(nextMeal)}
                  className="min-h-[44px] px-4 rounded-xl border border-[#2B487B] bg-[#0C1933] text-xs font-medium text-white hover:bg-[#172B52] transition-colors flex items-center gap-1.5"
                >
                  View Ingredients
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onLogMeal(nextMeal)}
                  className="min-h-[44px] px-4 rounded-xl bg-[#F5B800] hover:bg-[#FFCA28] text-[#091428] text-xs font-semibold transition-transform active:scale-[0.98] flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {loggedSlots.has(nextMeal.slot) ? 'Log Another' : 'Log Meal'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('meals')}
                  className="min-h-[44px] px-3 text-xs font-semibold text-[#FCD34D] hover:underline ml-auto"
                >
                  See All {plan.meals.length} Meals
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
