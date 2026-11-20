import React, { useEffect, useMemo, useState } from 'react';
import { CalendarCheck2, Compass, UserRound, UtensilsCrossed } from 'lucide-react';
import type {
  DailyMealPlan,
  LoggedFoodEntry,
  RecommendedMeal,
  UserProfile,
  WeightLogEntry,
} from './types';
import {
  BODY_GOAL_OPTIONS,
  DEFAULT_PROFILE,
  buildBaselinePlan,
  calculateNutritionTargets,
  getTodayDateKey,
} from './lib/nutrition';
import { TodayView } from './components/TodayView';
import { MealsView } from './components/MealsView';
import { TrackerView } from './components/TrackerView';
import { ProfileView } from './components/ProfileView';
import { MealDetailSheet, MealSwapSheet } from './components/BottomSheets';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineBanner } from './components/OfflineBanner';

type TabKey = 'today' | 'meals' | 'tracker' | 'profile';

const STORAGE_KEYS = {
  profile: 'vitalplate_profile_v1',
  plan: 'vitalplate_plan_v1',
  logs: 'vitalplate_logs_v1',
  water: 'vitalplate_water_v1',
  weights: 'vitalplate_weights_v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => getTodayDateKey());

  const [profile, setProfile] = useState<UserProfile>(() =>
    readStorage<UserProfile>(STORAGE_KEYS.profile, DEFAULT_PROFILE)
  );

  const targets = useMemo(() => calculateNutritionTargets(profile), [profile]);

  const [plan, setPlan] = useState<DailyMealPlan>(() =>
    readStorage<DailyMealPlan>(STORAGE_KEYS.plan, buildBaselinePlan(profile, targets))
  );

  const [logs, setLogs] = useState<LoggedFoodEntry[]>(() =>
    readStorage<LoggedFoodEntry[]>(STORAGE_KEYS.logs, [])
  );

  const [waterByDate, setWaterByDate] = useState<Record<string, number>>(() =>
    readStorage<Record<string, number>>(STORAGE_KEYS.water, {})
  );

  const [weightLogs, setWeightLogs] = useState<WeightLogEntry[]>(() =>
    readStorage<WeightLogEntry[]>(STORAGE_KEYS.weights, [])
  );

  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  const [inspectedMeal, setInspectedMeal] = useState<RecommendedMeal | null>(null);
  const [swapTargetMeal, setSwapTargetMeal] = useState<RecommendedMeal | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
    } catch {
      // ignore storage quota issues
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.plan, JSON.stringify(plan));
    } catch {
      // ignore storage quota issues
    }
  }, [plan]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
    } catch {
      // ignore storage quota issues
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.water, JSON.stringify(waterByDate));
    } catch {
      // ignore storage quota issues
    }
  }, [waterByDate]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.weights, JSON.stringify(weightLogs));
    } catch {
      // ignore storage quota issues
    }
  }, [weightLogs]);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const todayKey = getTodayDateKey();
  const todayLogs = useMemo(() => logs.filter((entry) => entry.dateKey === todayKey), [logs, todayKey]);
  const todayWaterMl = waterByDate[todayKey] ?? 0;

  const generatePersonalizedPlan = async (activeProfile: UserProfile, focusNote?: string) => {
    const activeTargets = calculateNutritionTargets(activeProfile);
    setIsGeneratingPlan(true);
    setPlanError(null);

    try {
      const response = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: activeProfile,
          targets: activeTargets,
          focusNote,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not generate personalized meal plan.');
      }
      setPlan(data as DailyMealPlan);
      setToastMessage('Personalized menu updated for your profile');
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Unable to reach recommendation service.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSaveProfileAndGenerate = async (updated: UserProfile) => {
    setProfile(updated);
    const updatedTargets = calculateNutritionTargets(updated);
    setPlan(buildBaselinePlan(updated, updatedTargets));
    setActiveTab('meals');
    await generatePersonalizedPlan(updated);
  };

  const handleConfirmSwap = async (currentMeal: RecommendedMeal, swapReason: string) => {
    setIsSwapping(true);
    setSwapError(null);

    try {
      const response = await fetch('/api/meal-swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          targets,
          currentMeal,
          swapReason,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate meal swap.');
      }
      const replacement = data as RecommendedMeal;
      setPlan((prev) => ({
        ...prev,
        meals: prev.meals.map((m) => (m.id === currentMeal.id ? replacement : m)),
      }));
      setSwapTargetMeal(null);
      setToastMessage(`Swapped ${currentMeal.slot} to ${replacement.title}`);
    } catch (err) {
      setSwapError(err instanceof Error ? err.message : 'Could not swap meal.');
    } finally {
      setIsSwapping(false);
    }
  };

  const handleLogMeal = (meal: RecommendedMeal) => {
    const entry: LoggedFoodEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      dateKey: todayKey,
      slot: meal.slot,
      title: meal.title,
      portion: meal.portionGuide,
      calories: meal.calories,
      proteinG: meal.proteinG,
      carbsG: meal.carbsG,
      fatG: meal.fatG,
      fiberG: meal.fiberG,
      loggedAt: new Date().toISOString(),
    };
    setLogs((prev) => [entry, ...prev]);
    setToastMessage(`Logged ${meal.title}`);
  };

  const handleAddCustomLog = (entry: Omit<LoggedFoodEntry, 'id' | 'loggedAt'>) => {
    const newEntry: LoggedFoodEntry = {
      ...entry,
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      loggedAt: new Date().toISOString(),
    };
    setLogs((prev) => [newEntry, ...prev]);
    setToastMessage(`Logged ${entry.title}`);
  };

  const handleRemoveLog = (id: string) => {
    setLogs((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddWater = (ml: number) => {
    setWaterByDate((prev) => ({
      ...prev,
      [todayKey]: (prev[todayKey] ?? 0) + ml,
    }));
  };

  const handleRecordWeight = (dateKey: string, weightKg: number) => {
    setWeightLogs((prev) => {
      const filtered = prev.filter((w) => w.dateKey !== dateKey);
      return [...filtered, { dateKey, weightKg }].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    });
    if (dateKey === todayKey) {
      setProfile((prev) => ({ ...prev, weightKg }));
    }
    setToastMessage('Weight check-in saved');
  };

  const navItems: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'today', label: 'Today', icon: Compass },
    { key: 'meals', label: 'Meals', icon: UtensilsCrossed },
    { key: 'tracker', label: 'Log', icon: CalendarCheck2 },
    { key: 'profile', label: 'Profile', icon: UserRound },
  ];

  const goalShort = BODY_GOAL_OPTIONS.find((g) => g.value === profile.bodyGoal)?.shortLabel ?? 'Goal';

  return (
    <div className="min-h-screen bg-[#091428] text-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Mobile Top App Bar (52px compact sticky header) */}
      <header className="lg:hidden sticky top-0 z-30 h-[52px] px-4 bg-[#0C1933]/95 backdrop-blur-md border-b border-[#1E355E] flex items-center justify-between gap-4 pt-safe">
        <span className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">
          Vital<span className="text-[#F5B800]">Plate</span>
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <PWAInstallButton variant="compact" />
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className="min-h-[44px] px-2 -mr-2 flex items-center text-xs font-semibold text-[#FCD34D] whitespace-nowrap shrink-0"
          >
            {targets.dailyCalories.toLocaleString()} kcal · {goalShort}
          </button>
        </div>
      </header>

      {/* Desktop Navigation Rail */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:sticky lg:top-0 lg:h-screen bg-[#0C1933] border-r border-[#1E355E] p-5 justify-between text-white">
        <div className="space-y-7">
          <div className="px-2">
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Vital<span className="text-[#F5B800]">Plate</span>
            </span>
          </div>

          <nav className="space-y-1" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full min-h-[44px] px-3.5 rounded-xl flex items-center gap-3 text-sm transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-[#F5B800] text-[#091428] font-semibold'
                      : 'text-[#A5B6D4] font-medium hover:bg-[#13264A] hover:text-white'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl bg-[#10203E] border border-[#1E355E] p-4 space-y-2">
            <p className="text-xs font-semibold text-[#FCD34D] truncate">
              {profile.name} · {goalShort}
            </p>
            <p className="font-mono text-xs text-white tabular-nums">
              BMI {targets.bmi.toFixed(1)} · {targets.dailyCalories.toLocaleString()} kcal/d
            </p>
            <p className="text-[11px] text-[#A5B6D4] leading-snug">
              {targets.macros.proteinG}g P · {targets.macros.carbsG}g C · {targets.macros.fatG}g F
            </p>
          </div>
          <PWAInstallButton variant="compact" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 pb-24 lg:pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-7">
          {activeTab === 'today' && (
            <TodayView
              profile={profile}
              targets={targets}
              plan={plan}
              todayLogs={todayLogs}
              waterMl={todayWaterMl}
              isGeneratingPlan={isGeneratingPlan}
              planError={planError}
              onAddWater={handleAddWater}
              onLogMeal={handleLogMeal}
              onInspectMeal={setInspectedMeal}
              onGeneratePlan={() => generatePersonalizedPlan(profile)}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'meals' && (
            <MealsView
              profile={profile}
              targets={targets}
              plan={plan}
              todayLogs={todayLogs}
              isGeneratingPlan={isGeneratingPlan}
              planError={planError}
              onGeneratePlan={(focusNote) => generatePersonalizedPlan(profile, focusNote)}
              onInspectMeal={setInspectedMeal}
              onSwapMeal={(meal) => {
                setSwapError(null);
                setSwapTargetMeal(meal);
              }}
              onLogMeal={handleLogMeal}
            />
          )}

          {activeTab === 'tracker' && (
            <TrackerView
              profile={profile}
              targets={targets}
              selectedDateKey={selectedDateKey}
              logs={logs}
              weightLogs={weightLogs}
              onSelectDate={setSelectedDateKey}
              onAddCustomLog={handleAddCustomLog}
              onRemoveLog={handleRemoveLog}
              onRecordWeight={handleRecordWeight}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              profile={profile}
              isGeneratingPlan={isGeneratingPlan}
              onSaveProfileAndGenerate={handleSaveProfileAndGenerate}
            />
          )}
        </div>
      </main>

      {/* Mobile Fixed Bottom Tab Bar (64px) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0C1933]/95 backdrop-blur-md border-t border-[#1E355E] pb-safe"
      >
        <div className="grid grid-cols-4 h-16 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveTab(item.key)}
                className={`min-h-[44px] flex flex-col items-center justify-center transition-colors ${
                  active ? 'text-[#FCD34D]' : 'text-[#A5B6D4]'
                }`}
              >
                <Icon className="w-[21px] h-[21px]" />
                <span className="text-[11px] font-medium tracking-tight mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Non-blocking Confirmation Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 py-2.5 rounded-xl bg-[#10203E] text-[#FCD34D] border border-[#F5B800]/50 text-xs font-semibold shadow-lg whitespace-nowrap"
        >
          {toastMessage}
        </div>
      )}

      <OfflineBanner />

      {/* Interactive Bottom Sheets */}
      <MealDetailSheet
        meal={inspectedMeal}
        isLogged={Boolean(inspectedMeal && todayLogs.some((l) => l.slot === inspectedMeal.slot))}
        onClose={() => setInspectedMeal(null)}
        onLogMeal={handleLogMeal}
        onOpenSwap={(meal) => {
          setSwapError(null);
          setSwapTargetMeal(meal);
        }}
      />

      <MealSwapSheet
        meal={swapTargetMeal}
        isSwapping={isSwapping}
        error={swapError}
        onClose={() => setSwapTargetMeal(null)}
        onConfirmSwap={handleConfirmSwap}
      />
    </div>
  );
}
