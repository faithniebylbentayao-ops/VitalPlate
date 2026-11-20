import React, { useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import type { UserProfile } from '../types';
import {
  ACTIVITY_OPTIONS,
  BODY_GOAL_OPTIONS,
  DIETARY_OPTIONS,
  HEALTH_CONSIDERATION_OPTIONS,
  PERSONA_PRESETS,
  calculateNutritionTargets,
  formatHeight,
  formatWeight,
} from '../lib/nutrition';
import { PWAInstallButton } from './PWAInstallButton';

interface ProfileViewProps {
  profile: UserProfile;
  isGeneratingPlan: boolean;
  onSaveProfileAndGenerate: (updated: UserProfile) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  isGeneratingPlan,
  onSaveProfileAndGenerate,
}) => {
  const [draft, setDraft] = useState<UserProfile>(profile);
  const previewTargets = calculateNutritionTargets(draft);

  const toggleConsideration = (item: string) => {
    setDraft((prev) => {
      const exists = prev.healthConsiderations.includes(item);
      return {
        ...prev,
        healthConsiderations: exists
          ? prev.healthConsiderations.filter((c) => c !== item)
          : [...prev.healthConsiderations, item],
      };
    });
  };

  const applyPreset = (presetProfile: UserProfile) => {
    setDraft(presetProfile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfileAndGenerate(draft);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-xs font-medium text-[#A5B6D4]">Personalization & Biometrics</p>
        <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight mt-0.5">
          Body Profile & Goals
        </h1>
      </div>

      <PWAInstallButton variant="card" />

      {/* Quick Cohort Presets */}
      <section className="bg-[#10203E] rounded-3xl border border-[#1E355E] p-4 space-y-2.5">
        <p className="text-xs font-medium text-[#A5B6D4]">
          Load a starting profile or customize your exact metrics below
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PERSONA_PRESETS.map((preset) => {
            const active =
              draft.bodyGoal === preset.profile.bodyGoal &&
              draft.weightKg === preset.profile.weightKg &&
              draft.name === preset.profile.name;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.profile)}
                className={`min-h-[56px] p-3 rounded-2xl border text-left transition-colors ${
                  active
                    ? 'bg-[#172B52] border-[#F5B800] text-white'
                    : 'bg-[#0C1933] border-[#1E355E] text-[#DCE4F2] hover:border-[#34548B]'
                }`}
              >
                <p className={`text-xs font-semibold ${active ? 'text-[#FCD34D]' : 'text-white'}`}>
                  {preset.label}
                </p>
                <p className="text-[11px] text-[#A5B6D4] mt-0.5">{preset.summary}</p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Form Inputs */}
        <div className="lg:col-span-7 space-y-5">
          {/* Biometrics */}
          <section className="bg-[#10203E] rounded-3xl border border-[#1E355E] p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-white">Physical Metrics</h2>
              <div className="flex items-center gap-1 p-1 bg-[#0C1933] border border-[#1E355E] rounded-lg">
                {(['metric', 'imperial'] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, unitSystem: unit }))}
                    className={`min-h-[34px] px-2.5 rounded-md text-xs font-semibold capitalize transition-colors ${
                      draft.unitSystem === unit
                        ? 'bg-[#F5B800] text-[#091428]'
                        : 'text-[#A5B6D4] hover:text-white'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="profile-name" className="block text-xs font-medium text-[#A5B6D4] mb-1">
                  Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  required
                  value={draft.name}
                  onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#233D6B] bg-[#0C1933] text-sm text-white focus:outline-none focus:border-[#F5B800]"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <span className="block text-xs font-medium text-[#A5B6D4] mb-1">Biological Sex (BMR)</span>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0C1933] border border-[#1E355E] rounded-xl">
                  {(['female', 'male'] as const).map((sex) => (
                    <button
                      key={sex}
                      type="button"
                      onClick={() => setDraft((p) => ({ ...p, sex }))}
                      className={`min-h-[36px] rounded-lg text-xs font-semibold capitalize transition-colors ${
                        draft.sex === sex
                          ? 'bg-[#F5B800] text-[#091428]'
                          : 'text-[#A5B6D4] hover:text-white'
                      }`}
                    >
                      {sex}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="profile-age" className="block text-xs font-medium text-[#A5B6D4] mb-1">
                  Age (years)
                </label>
                <input
                  id="profile-age"
                  type="number"
                  min={15}
                  max={95}
                  required
                  value={draft.age}
                  onChange={(e) => setDraft((p) => ({ ...p, age: Math.max(15, Math.min(95, Number(e.target.value) || 25)) }))}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#233D6B] bg-[#0C1933] font-mono text-sm text-white tabular-nums focus:outline-none focus:border-[#F5B800]"
                />
              </div>

              <div>
                <label htmlFor="profile-height" className="block text-xs font-medium text-[#A5B6D4] mb-1">
                  Height ({formatHeight(draft.heightCm, draft.unitSystem)})
                </label>
                <input
                  id="profile-height"
                  type="number"
                  min={120}
                  max={230}
                  required
                  value={draft.heightCm}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, heightCm: Math.max(120, Math.min(230, Number(e.target.value) || 170)) }))
                  }
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#233D6B] bg-[#0C1933] font-mono text-sm text-white tabular-nums focus:outline-none focus:border-[#F5B800]"
                />
              </div>

              <div>
                <label htmlFor="profile-weight" className="block text-xs font-medium text-[#A5B6D4] mb-1">
                  Current Weight ({formatWeight(draft.weightKg, draft.unitSystem)})
                </label>
                <input
                  id="profile-weight"
                  type="number"
                  step="0.5"
                  min={30}
                  max={250}
                  required
                  value={draft.weightKg}
                  onChange={(e) =>
                    setDraft((p) => ({ ...p, weightKg: Math.max(30, Math.min(250, Number(e.target.value) || 65)) }))
                  }
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#233D6B] bg-[#0C1933] font-mono text-sm text-white tabular-nums focus:outline-none focus:border-[#F5B800]"
                />
              </div>

              <div>
                <label htmlFor="profile-target" className="block text-xs font-medium text-[#A5B6D4] mb-1">
                  Target Weight ({formatWeight(draft.targetWeightKg, draft.unitSystem)})
                </label>
                <input
                  id="profile-target"
                  type="number"
                  step="0.5"
                  min={35}
                  max={220}
                  required
                  value={draft.targetWeightKg}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      targetWeightKg: Math.max(35, Math.min(220, Number(e.target.value) || 65)),
                    }))
                  }
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#233D6B] bg-[#0C1933] font-mono text-sm text-white tabular-nums focus:outline-none focus:border-[#F5B800]"
                />
              </div>
            </div>
          </section>

          {/* Body Goal & Activity */}
          <section className="bg-[#10203E] rounded-3xl border border-[#1E355E] p-5 space-y-4">
            <h2 className="text-base font-bold text-white">Personal Body Goal</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BODY_GOAL_OPTIONS.map((goal) => {
                const active = draft.bodyGoal === goal.value;
                return (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => setDraft((p) => ({ ...p, bodyGoal: goal.value }))}
                    className={`min-h-[56px] p-3.5 rounded-2xl border text-left transition-colors ${
                      active
                        ? 'bg-[#172B52] border-[#F5B800]'
                        : 'bg-[#0C1933] border-[#1E355E] hover:border-[#34548B]'
                    }`}
                  >
                    <p className={`text-xs font-bold ${active ? 'text-[#FCD34D]' : 'text-white'}`}>
                      {goal.label}
                    </p>
                    <p className="text-[11px] mt-0.5 leading-snug text-[#A5B6D4]">
                      {goal.detail}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label htmlFor="profile-activity" className="block text-xs font-medium text-[#A5B6D4] mb-1.5">
                Weekly Activity Level
              </label>
              <select
                id="profile-activity"
                value={draft.activityLevel}
                onChange={(e) => setDraft((p) => ({ ...p, activityLevel: e.target.value as UserProfile['activityLevel'] }))}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#233D6B] bg-[#0C1933] text-sm text-white focus:outline-none focus:border-[#F5B800]"
              >
                {ACTIVITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.detail}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="profile-diet" className="block text-xs font-medium text-[#A5B6D4] mb-1.5">
                Dietary Preference
              </label>
              <select
                id="profile-diet"
                value={draft.dietaryPreference}
                onChange={(e) =>
                  setDraft((p) => ({ ...p, dietaryPreference: e.target.value as UserProfile['dietaryPreference'] }))
                }
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#233D6B] bg-[#0C1933] text-sm text-white focus:outline-none focus:border-[#F5B800]"
              >
                {DIETARY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Health Considerations */}
          <section className="bg-[#10203E] rounded-3xl border border-[#1E355E] p-5 space-y-3">
            <div>
              <h2 className="text-base font-bold text-white">Health Considerations & Exclusions</h2>
              <p className="text-xs text-[#A5B6D4] mt-0.5">
                Recommendations strictly adapt macronutrient balance and exclude selected allergens.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {HEALTH_CONSIDERATION_OPTIONS.map((item) => {
                const active = draft.healthConsiderations.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleConsideration(item)}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-left text-xs font-medium flex items-center justify-between gap-2 transition-colors ${
                      active
                        ? 'bg-[#172B52] border-[#F5B800] text-[#FCD34D]'
                        : 'bg-[#0C1933] border-[#1E355E] text-[#DCE4F2] hover:border-[#34548B]'
                    }`}
                  >
                    <span>{item}</span>
                    {active && <Check className="w-3.5 h-3.5 text-[#FCD34D] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Live Scientific Target Preview */}
        <aside className="lg:col-span-5 bg-[#10203E] text-white rounded-3xl border border-[#233D6B] p-5 space-y-4 lg:sticky lg:top-20">
          <div>
            <p className="text-xs font-medium text-[#FCD34D]">Live Clinical Calculation</p>
            <h2 className="text-lg font-bold text-white mt-0.5">Your Calculated Daily Targets</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-[#0C1933] rounded-2xl p-4 border border-[#1E355E]">
            <div>
              <p className="text-xs text-[#A5B6D4]">Daily Energy</p>
              <p className="font-mono text-2xl font-semibold text-[#FCD34D] tabular-nums">
                {previewTargets.dailyCalories.toLocaleString()}
                <span className="text-xs font-normal text-[#A5B6D4] ml-1">kcal</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-[#A5B6D4]">BMI Status</p>
              <p className="font-mono text-base font-semibold text-white tabular-nums mt-1">
                {previewTargets.bmi.toFixed(1)} · {previewTargets.bmiCategory}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#A5B6D4]">Basal Rate (BMR)</p>
              <p className="font-mono text-sm font-medium text-white tabular-nums">
                {previewTargets.bmr.toLocaleString()} kcal
              </p>
            </div>
            <div>
              <p className="text-xs text-[#A5B6D4]">Total Burn (TDEE)</p>
              <p className="font-mono text-sm font-medium text-white tabular-nums">
                {previewTargets.tdee.toLocaleString()} kcal
              </p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="rounded-xl bg-[#0C1933] p-2.5 border border-[#1E355E]">
              <p className="text-[11px] text-[#A5B6D4]">Protein</p>
              <p className="font-mono text-sm font-semibold text-[#FCD34D] tabular-nums mt-0.5">
                {previewTargets.macros.proteinG}g
              </p>
            </div>
            <div className="rounded-xl bg-[#0C1933] p-2.5 border border-[#1E355E]">
              <p className="text-[11px] text-[#A5B6D4]">Carbs</p>
              <p className="font-mono text-sm font-semibold text-[#93C5FD] tabular-nums mt-0.5">
                {previewTargets.macros.carbsG}g
              </p>
            </div>
            <div className="rounded-xl bg-[#0C1933] p-2.5 border border-[#1E355E]">
              <p className="text-[11px] text-[#A5B6D4]">Fat</p>
              <p className="font-mono text-sm font-semibold text-white tabular-nums mt-0.5">
                {previewTargets.macros.fatG}g
              </p>
            </div>
            <div className="rounded-xl bg-[#0C1933] p-2.5 border border-[#1E355E]">
              <p className="text-[11px] text-[#A5B6D4]">Fiber</p>
              <p className="font-mono text-sm font-semibold text-white tabular-nums mt-0.5">
                {previewTargets.macros.fiberG}g
              </p>
            </div>
          </div>

          <p className="text-xs text-[#DCE4F2] leading-relaxed">{previewTargets.bmiGuidance}</p>

          <button
            type="submit"
            disabled={isGeneratingPlan}
            className="w-full min-h-[48px] rounded-xl bg-[#F5B800] hover:bg-[#FFCA28] disabled:opacity-70 text-[#091428] text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isGeneratingPlan ? 'animate-spin' : ''}`} />
            {isGeneratingPlan ? 'Generating Tailored Menu...' : 'Save Profile & Generate Menu'}
          </button>
        </aside>
      </div>
    </form>
  );
};
