import React, { useMemo, useState } from 'react';
import { Plus, Scale, SearchCheck, Trash2 } from 'lucide-react';
import type { LoggedFoodEntry, MealSlot, NutritionTargets, UserProfile, WeightLogEntry } from '../types';
import { formatWeight, getWeekDates } from '../lib/nutrition';
import { MEAL_SLOT_LABELS } from '../lib/mealImages';

interface TrackerViewProps {
  profile: UserProfile;
  targets: NutritionTargets;
  selectedDateKey: string;
  logs: LoggedFoodEntry[];
  weightLogs: WeightLogEntry[];
  onSelectDate: (dateKey: string) => void;
  onAddCustomLog: (entry: Omit<LoggedFoodEntry, 'id' | 'loggedAt'>) => void;
  onRemoveLog: (id: string) => void;
  onRecordWeight: (dateKey: string, weightKg: number) => void;
}

interface AnalyzedFoodResult {
  title: string;
  portion: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  goalFitNote: string;
}

export const TrackerView: React.FC<TrackerViewProps> = ({
  profile,
  targets,
  selectedDateKey,
  logs,
  weightLogs,
  onSelectDate,
  onAddCustomLog,
  onRemoveLog,
  onRecordWeight,
}) => {
  const weekDates = useMemo(() => getWeekDates(), []);
  const dayLogs = logs.filter((item) => item.dateKey === selectedDateKey);

  const [foodQuery, setFoodQuery] = useState('');
  const [slotChoice, setSlotChoice] = useState<MealSlot>('lunch');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzedResult, setAnalyzedResult] = useState<AnalyzedFoodResult | null>(null);

  const existingDayWeight = weightLogs.find((w) => w.dateKey === selectedDateKey)?.weightKg ?? profile.weightKg;
  const [weightInput, setWeightInput] = useState<string>(String(existingDayWeight));

  const totals = dayLogs.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      proteinG: acc.proteinG + item.proteinG,
      carbsG: acc.carbsG + item.carbsG,
      fatG: acc.fatG + item.fatG,
      fiberG: acc.fiberG + item.fiberG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 }
  );

  const handleAnalyzeFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodQuery.trim()) return;
    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      const response = await fetch('/api/food-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          targets,
          foodDescription: foodQuery.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not analyze food entry.');
      }
      setAnalyzedResult(data as AnalyzedFoodResult);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Unable to analyze food right now.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCommitAnalyzed = () => {
    if (!analyzedResult) return;
    onAddCustomLog({
      dateKey: selectedDateKey,
      slot: slotChoice,
      title: analyzedResult.title,
      portion: analyzedResult.portion,
      calories: analyzedResult.calories,
      proteinG: analyzedResult.proteinG,
      carbsG: analyzedResult.carbsG,
      fatG: analyzedResult.fatG,
      fiberG: analyzedResult.fiberG,
      goalFitNote: analyzedResult.goalFitNote,
    });
    setFoodQuery('');
    setAnalyzedResult(null);
  };

  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(weightInput);
    if (!Number.isFinite(numeric) || numeric < 25 || numeric > 350) return;
    const kg = profile.unitSystem === 'imperial' ? Math.round((numeric / 2.20462) * 10) / 10 : numeric;
    onRecordWeight(selectedDateKey, kg);
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-[#A5B6D4]">Intake & Body Metrics</p>
        <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight mt-0.5">Daily Food Log</h1>
      </div>

      {/* Horizontal 7-Day Date Scroller */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {weekDates.map((d) => {
          const active = d.dateKey === selectedDateKey;
          return (
            <button
              key={d.dateKey}
              type="button"
              onClick={() => onSelectDate(d.dateKey)}
              className={`min-h-[56px] min-w-[46px] flex-1 rounded-2xl flex flex-col items-center justify-center transition-colors shrink-0 ${
                active
                  ? 'bg-[#F5B800] text-[#091428]'
                  : 'bg-[#10203E] border border-[#1E355E] text-[#A5B6D4] hover:text-white'
              }`}
            >
              <span className="text-[11px] font-semibold opacity-85">{d.dayShort}</span>
              <span className="font-mono text-sm font-semibold tabular-nums mt-0.5">{d.dayNum}</span>
            </button>
          );
        })}
      </div>

      {/* Intake Summary Strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#10203E] rounded-2xl border border-[#1E355E] p-3.5">
          <p className="text-xs text-[#A5B6D4]">Calories</p>
          <p className="font-mono text-lg font-semibold text-white tabular-nums mt-0.5">
            {totals.calories.toLocaleString()}
            <span className="text-xs font-normal text-[#A5B6D4]"> / {targets.dailyCalories}</span>
          </p>
        </div>
        <div className="bg-[#10203E] rounded-2xl border border-[#1E355E] p-3.5">
          <p className="text-xs text-[#A5B6D4]">Protein</p>
          <p className="font-mono text-lg font-semibold text-[#FCD34D] tabular-nums mt-0.5">
            {totals.proteinG}g
            <span className="text-xs font-normal text-[#A5B6D4]"> / {targets.macros.proteinG}g</span>
          </p>
        </div>
        <div className="bg-[#10203E] rounded-2xl border border-[#1E355E] p-3.5">
          <p className="text-xs text-[#A5B6D4]">Carbs</p>
          <p className="font-mono text-lg font-semibold text-[#93C5FD] tabular-nums mt-0.5">
            {totals.carbsG}g
            <span className="text-xs font-normal text-[#A5B6D4]"> / {targets.macros.carbsG}g</span>
          </p>
        </div>
        <div className="bg-[#10203E] rounded-2xl border border-[#1E355E] p-3.5">
          <p className="text-xs text-[#A5B6D4]">Fat · Fiber</p>
          <p className="font-mono text-lg font-semibold text-white tabular-nums mt-0.5">
            {totals.fatG}g · {totals.fiberG}g
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Smart Food Check & Custom Logger */}
        <section className="lg:col-span-5 bg-[#10203E] rounded-3xl border border-[#1E355E] p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold text-white">Smart Meal & Craving Check</h2>
            <p className="text-xs text-[#A5B6D4] mt-1 leading-relaxed">
              Describe any meal or snack to estimate macros and check how it fits your body goal before logging.
            </p>
          </div>

          <form onSubmit={handleAnalyzeFood} className="space-y-3">
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#0C1933] border border-[#1E355E] rounded-xl">
              {(['breakfast', 'lunch', 'snack', 'dinner'] as MealSlot[]).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSlotChoice(slot)}
                  className={`min-h-[36px] rounded-lg text-xs font-semibold capitalize transition-colors ${
                    slotChoice === slot ? 'bg-[#F5B800] text-[#091428]' : 'text-[#A5B6D4] hover:text-white'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={foodQuery}
              onChange={(e) => setFoodQuery(e.target.value)}
              placeholder="e.g. 2 scrambled eggs on whole-grain toast with half an avocado"
              className="w-full p-3 rounded-xl border border-[#233D6B] bg-[#0C1933] text-sm text-white placeholder:text-[#6C82A8] focus:outline-none focus:border-[#F5B800]"
            />

            <button
              type="submit"
              disabled={isAnalyzing || !foodQuery.trim()}
              className="w-full min-h-[44px] rounded-xl bg-[#F5B800] hover:bg-[#FFCA28] disabled:opacity-60 text-[#091428] text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <SearchCheck className="w-4 h-4" />
              {isAnalyzing ? 'Analyzing Nutrition...' : 'Analyze Nutrition & Goal Fit'}
            </button>
          </form>

          {analyzeError && (
            <div className="rounded-xl bg-[#2B1218] border border-[#7F1D1D] p-3 text-xs text-[#FECACA]">
              {analyzeError}
            </div>
          )}

          {analyzedResult && (
            <div className="rounded-2xl bg-[#16294D] border border-[#F5B800]/35 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-white">{analyzedResult.title}</p>
                  <p className="text-xs text-[#A5B6D4]">{analyzedResult.portion}</p>
                </div>
                <span className="font-mono text-sm font-semibold text-[#FCD34D] tabular-nums shrink-0">
                  {analyzedResult.calories} kcal
                </span>
              </div>
              <p className="font-mono text-xs text-[#DCE4F2] tabular-nums">
                {analyzedResult.proteinG}g protein · {analyzedResult.carbsG}g carbs · {analyzedResult.fatG}g fat ·{' '}
                {analyzedResult.fiberG}g fiber
              </p>
              <p className="text-xs text-[#FCD34D] leading-relaxed">{analyzedResult.goalFitNote}</p>
              <button
                type="button"
                onClick={handleCommitAnalyzed}
                className="w-full min-h-[44px] rounded-xl bg-[#F5B800] hover:bg-[#FFCA28] text-[#091428] text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add to {MEAL_SLOT_LABELS[slotChoice]} Log
              </button>
            </div>
          )}

          {/* Quick Weight Check-in */}
          <form onSubmit={handleSaveWeight} className="pt-4 border-t border-[#1E355E] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-[#FCD34D]" />
                Weight Check-In
              </span>
              <span className="text-[#A5B6D4]">
                Goal: {formatWeight(profile.targetWeightKg, profile.unitSystem)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="flex-1 min-h-[44px] px-3 rounded-xl border border-[#233D6B] bg-[#0C1933] font-mono text-sm text-white tabular-nums focus:outline-none focus:border-[#F5B800]"
              />
              <span className="text-xs font-medium text-[#A5B6D4]">
                {profile.unitSystem === 'imperial' ? 'lb' : 'kg'}
              </span>
              <button
                type="submit"
                className="min-h-[44px] px-4 rounded-xl border border-[#2B487B] bg-[#172B52] hover:bg-[#1E3768] text-xs font-semibold text-[#FCD34D]"
              >
                Save
              </button>
            </div>
          </form>
        </section>

        {/* Logged Meals List */}
        <section className="lg:col-span-7 bg-[#10203E] rounded-3xl border border-[#1E355E] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white">Logged Meals</h2>
            <span className="text-xs text-[#FCD34D] font-mono tabular-nums">{dayLogs.length} entries</span>
          </div>

          {dayLogs.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-medium text-white">No meals logged for this day yet</p>
              <p className="text-xs text-[#A5B6D4] max-w-sm mx-auto">
                Log a meal from your Recommended Menu or use the Smart Meal Check to record any food you eat.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#1E355E]">
              {dayLogs.map((entry) => (
                <li key={entry.id} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[#A5B6D4]">
                      {MEAL_SLOT_LABELS[entry.slot]} · {entry.portion}
                    </p>
                    <p className="text-sm font-semibold text-white mt-0.5 truncate">{entry.title}</p>
                    <p className="font-mono text-xs text-[#A5B6D4] tabular-nums mt-1">
                      {entry.calories} kcal · {entry.proteinG}g P · {entry.carbsG}g C · {entry.fatG}g F
                    </p>
                    {entry.goalFitNote && (
                      <p className="text-xs text-[#FCD34D] mt-1 leading-relaxed">{entry.goalFitNote}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveLog(entry.id)}
                    aria-label={`Remove ${entry.title}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#A5B6D4] hover:text-[#FECACA] hover:bg-[#2B1218] transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
