import React, { useEffect, useState } from 'react';
import { Check, Clock, RefreshCw, X } from 'lucide-react';
import type { RecommendedMeal } from '../types';
import { MEAL_SLOT_LABELS } from '../lib/mealImages';
import { MealImage } from './MealImage';

interface MealDetailSheetProps {
  meal: RecommendedMeal | null;
  isLogged: boolean;
  onClose: () => void;
  onLogMeal: (meal: RecommendedMeal) => void;
  onOpenSwap: (meal: RecommendedMeal) => void;
}

export const MealDetailSheet: React.FC<MealDetailSheetProps> = ({
  meal,
  isLogged,
  onClose,
  onLogMeal,
  onOpenSwap,
}) => {
  useEffect(() => {
    if (!meal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [meal, onClose]);

  if (!meal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-[#040A17]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="meal-sheet-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#10203E] rounded-t-3xl lg:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-[#233D6B] text-[#F8FAFC]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1.5 bg-[#2B487B] rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1E355E] shrink-0">
          <span className="text-xs font-medium text-[#A5B6D4]">
            {MEAL_SLOT_LABELS[meal.slot]} · {meal.prepMinutes} min prep
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close meal details"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-[#A5B6D4] hover:text-white hover:bg-[#172B52] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">
          <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden bg-[#0C1933]">
            <MealImage slot={meal.slot} alt={meal.title} className="w-full h-full" />
          </div>

          <div>
            <h2 id="meal-sheet-title" className="text-xl font-bold text-white leading-snug">
              {meal.title}
            </h2>
            <p className="text-sm text-[#A5B6D4] mt-1 leading-relaxed">{meal.subtitle}</p>
          </div>

          <div className="grid grid-cols-4 gap-2 bg-[#0C1933] rounded-2xl p-3.5 border border-[#1E355E]">
            <div>
              <p className="text-xs text-[#A5B6D4]">Energy</p>
              <p className="font-mono text-base font-semibold text-white tabular-nums mt-0.5">
                {meal.calories}
                <span className="text-[11px] font-normal text-[#A5B6D4] ml-0.5">kcal</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-[#A5B6D4]">Protein</p>
              <p className="font-mono text-base font-semibold text-[#FCD34D] tabular-nums mt-0.5">
                {meal.proteinG}g
              </p>
            </div>
            <div>
              <p className="text-xs text-[#A5B6D4]">Carbs</p>
              <p className="font-mono text-base font-semibold text-[#93C5FD] tabular-nums mt-0.5">
                {meal.carbsG}g
              </p>
            </div>
            <div>
              <p className="text-xs text-[#A5B6D4]">Fat / Fiber</p>
              <p className="font-mono text-base font-semibold text-white tabular-nums mt-0.5">
                {meal.fatG}g · {meal.fiberG}g
              </p>
            </div>
          </div>

          <div className="bg-[#16294D] rounded-2xl p-4 border border-[#F5B800]/30">
            <p className="text-xs font-semibold text-[#FCD34D]">Why this fits your goal</p>
            <p className="text-sm text-[#E2E9F5] mt-1 leading-relaxed">{meal.scientificRationale}</p>
            <p className="text-xs text-[#A5B6D4] mt-2.5">
              Key nutrients: {meal.keyMicronutrients.join(' · ')}
            </p>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Ingredients & Portioning</h3>
              <span className="text-xs text-[#A5B6D4] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {meal.prepMinutes} min
              </span>
            </div>
            <p className="text-xs text-[#A5B6D4] mb-3">{meal.portionGuide}</p>
            <ul className="divide-y divide-[#1E355E] border-t border-b border-[#1E355E]">
              {meal.ingredients.map((ing, i) => (
                <li key={i} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                  <span className="text-[#E2E9F5]">{ing.item}</span>
                  <span className="font-mono text-xs font-medium text-[#FCD34D] tabular-nums shrink-0">
                    {ing.amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-2.5">Preparation</h3>
            <ol className="space-y-2.5">
              {meal.prepSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-[#DCE4F2] leading-relaxed">
                  <span className="font-mono text-xs font-semibold text-[#FCD34D] mt-0.5 shrink-0 tabular-nums">
                    0{idx + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="p-4 border-t border-[#1E355E] bg-[#0C1933] flex items-center gap-3 pb-safe shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSwap(meal);
            }}
            className="min-h-[48px] px-4 rounded-xl border border-[#2B487B] bg-[#13264A] text-sm font-medium text-white hover:bg-[#193260] transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            Swap
          </button>
          <button
            type="button"
            onClick={() => {
              onLogMeal(meal);
              onClose();
            }}
            className={`min-h-[48px] flex-1 rounded-xl text-sm font-semibold transition-transform active:scale-[0.98] flex items-center justify-center gap-2 whitespace-nowrap ${
              isLogged
                ? 'bg-[#172B52] text-[#FCD34D] border border-[#F5B800]/40'
                : 'bg-[#F5B800] text-[#091428] hover:bg-[#FFCA28]'
            }`}
          >
            <Check className="w-4 h-4" />
            {isLogged ? 'Log Another Serving' : 'Log This Meal'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface MealSwapSheetProps {
  meal: RecommendedMeal | null;
  isSwapping: boolean;
  error: string | null;
  onClose: () => void;
  onConfirmSwap: (meal: RecommendedMeal, reason: string) => void;
}

const SWAP_QUICK_REASONS = [
  'Under 10 minutes prep',
  'Warm savory comfort option',
  'Budget-friendly pantry staples',
  'Extra protein satiety boost',
  'Lighter on digestion',
  'Different protein source',
];

export const MealSwapSheet: React.FC<MealSwapSheetProps> = ({
  meal,
  isSwapping,
  error,
  onClose,
  onConfirmSwap,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(SWAP_QUICK_REASONS[0]);
  const [customNote, setCustomNote] = useState<string>('');

  useEffect(() => {
    if (!meal) return;
    setCustomNote('');
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSwapping) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [meal, isSwapping, onClose]);

  if (!meal) return null;

  const finalReason = customNote.trim() || selectedReason;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-[#040A17]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="swap-sheet-title"
      onClick={() => !isSwapping && onClose()}
    >
      <div
        className="w-full max-w-lg bg-[#10203E] rounded-t-3xl lg:rounded-3xl overflow-hidden shadow-2xl border border-[#233D6B] text-[#F8FAFC]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lg:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 bg-[#2B487B] rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1E355E]">
          <span className="text-xs font-medium text-[#A5B6D4]">
            Swap {MEAL_SLOT_LABELS[meal.slot]} · ~{meal.calories} kcal budget
          </span>
          <button
            type="button"
            disabled={isSwapping}
            onClick={onClose}
            aria-label="Close swap sheet"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-[#A5B6D4] hover:text-white disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h2 id="swap-sheet-title" className="text-lg font-bold text-white">
              Replace "{meal.title}"
            </h2>
            <p className="text-sm text-[#A5B6D4] mt-1">
              Keep your {meal.calories} kcal and {meal.proteinG}g protein target while switching ingredients.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {SWAP_QUICK_REASONS.map((reason) => {
              const active = !customNote.trim() && selectedReason === reason;
              return (
                <button
                  key={reason}
                  type="button"
                  disabled={isSwapping}
                  onClick={() => {
                    setCustomNote('');
                    setSelectedReason(reason);
                  }}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-left text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-[#172B52] border-[#F5B800] text-[#FCD34D]'
                      : 'bg-[#0C1933] border-[#1E355E] text-[#DCE4F2] hover:border-[#34548B]'
                  }`}
                >
                  {reason}
                </button>
              );
            })}
          </div>

          <div>
            <label htmlFor="swap-custom-input" className="block text-xs font-medium text-[#A5B6D4] mb-1.5">
              Or describe what you prefer / have in your kitchen
            </label>
            <input
              id="swap-custom-input"
              type="text"
              value={customNote}
              disabled={isSwapping}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. Eggs and spinach, or no seafood today"
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#233D6B] bg-[#0C1933] text-sm text-white placeholder:text-[#6C82A8] focus:outline-none focus:border-[#F5B800]"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-[#2B1218] border border-[#7F1D1D] p-3 text-xs text-[#FECACA]">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={isSwapping}
            onClick={() => onConfirmSwap(meal, finalReason)}
            className="w-full min-h-[48px] rounded-xl bg-[#F5B800] hover:bg-[#FFCA28] disabled:opacity-70 text-[#091428] text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSwapping ? 'animate-spin' : ''}`} />
            {isSwapping ? 'Finding tailored replacement...' : 'Generate Equivalent Replacement'}
          </button>
        </div>
      </div>
    </div>
  );
};
