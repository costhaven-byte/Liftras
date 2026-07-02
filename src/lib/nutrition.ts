/**
 * Nutrition engine — pure, deterministic, no external APIs.
 *
 * Pipeline: body stats → BMR (Mifflin–St Jeor) → TDEE (× activity) →
 * goal-adjusted target calories → macro grams. Everything here is a
 * pure function of its inputs so targets can always be recomputed from
 * the current profile + latest weigh-in (we never store stale targets).
 */

export type Sex = "male" | "female";
export type Units = "metric" | "imperial";
export type Goal = "cut" | "maintain" | "bulk";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "very"
  | "athlete";

export const ACTIVITY: Record<
  ActivityLevel,
  { factor: number; label: string; hint: string }
> = {
  sedentary: { factor: 1.2, label: "Sedentary", hint: "Desk job, little exercise" },
  light: { factor: 1.375, label: "Light", hint: "Light training 1–3 days/week" },
  moderate: { factor: 1.55, label: "Moderate", hint: "Training 3–5 days/week" },
  very: { factor: 1.725, label: "Very active", hint: "Hard training 6–7 days/week" },
  athlete: { factor: 1.9, label: "Athlete", hint: "2× daily / physical job" },
};

export const GOALS: Record<
  Goal,
  { label: string; pct: number; hint: string }
> = {
  // pct = fraction applied to TDEE. Lean, sustainable defaults.
  cut: { label: "Cut", pct: -0.2, hint: "~0.5 kg/week fat loss" },
  maintain: { label: "Maintain", pct: 0, hint: "Hold current weight" },
  bulk: { label: "Bulk", pct: 0.12, hint: "Lean muscle gain" },
};

export interface Macros {
  kcal: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
}

const KCAL_PER = { protein: 4, carbs: 4, fat: 9 } as const;

/** Mifflin–St Jeor BMR (kcal/day). Most-validated equation for healthy adults. */
export function bmrMifflinStJeor(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return base + (sex === "male" ? 5 : -161);
}

/** Total Daily Energy Expenditure = BMR × activity factor. */
export function tdee(bmr: number, activity: ActivityLevel): number {
  return bmr * ACTIVITY[activity].factor;
}

/** Goal-adjusted daily calorie target. */
export function targetCalories(tdeeValue: number, goal: Goal): number {
  return tdeeValue * (1 + GOALS[goal].pct);
}

/**
 * Macro targets from a calorie budget using an evidence-based split:
 * protein & fat anchored per kg of bodyweight, carbs fill the remainder.
 * Protein pushes higher on a cut to protect lean mass.
 */
export function macrosForGoal(
  targetKcal: number,
  weightKg: number,
  goal: Goal,
): Macros {
  const proteinPerKg = goal === "cut" ? 2.2 : goal === "bulk" ? 1.8 : 2.0;
  const fatPerKg = 0.9;

  const protein = Math.round(proteinPerKg * weightKg);
  const fat = Math.round(fatPerKg * weightKg);

  const remaining =
    targetKcal - protein * KCAL_PER.protein - fat * KCAL_PER.fat;
  const carbs = Math.max(0, Math.round(remaining / KCAL_PER.carbs));

  return { kcal: Math.round(targetKcal), protein, carbs, fat };
}

/** Sum macro grams into calories (used when logging manual meals). */
export function caloriesFromMacros(
  protein: number,
  carbs: number,
  fat: number,
): number {
  return Math.round(
    protein * KCAL_PER.protein + carbs * KCAL_PER.carbs + fat * KCAL_PER.fat,
  );
}

/** Percentage split (e.g. 40/30/30) of a calorie target → macro grams. */
export function macrosFromPercentSplit(
  targetKcal: number,
  proteinPct: number,
  carbsPct: number,
  fatPct: number,
): Macros {
  return {
    kcal: Math.round(targetKcal),
    protein: Math.round((targetKcal * proteinPct) / 100 / KCAL_PER.protein),
    carbs: Math.round((targetKcal * carbsPct) / 100 / KCAL_PER.carbs),
    fat: Math.round((targetKcal * fatPct) / 100 / KCAL_PER.fat),
  };
}

export interface NutritionProfile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
}

/** End-to-end: profile → BMR, TDEE, target calories, and macro grams. */
export function computeTargets(p: NutritionProfile) {
  const bmr = bmrMifflinStJeor(p.sex, p.weightKg, p.heightCm, p.age);
  const tdeeValue = tdee(bmr, p.activity);
  const kcal = targetCalories(tdeeValue, p.goal);
  const macros = macrosForGoal(kcal, p.weightKg, p.goal);
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdeeValue),
    macros,
  };
}

/* ---------------------------- unit helpers ---------------------------- */

export const KG_PER_LB = 0.45359237;
export const CM_PER_IN = 2.54;

export const lbToKg = (lb: number) => lb * KG_PER_LB;
export const kgToLb = (kg: number) => kg / KG_PER_LB;
export const inToCm = (inch: number) => inch * CM_PER_IN;
export const cmToIn = (cm: number) => cm / CM_PER_IN;

export const displayWeight = (kg: number, units: Units) =>
  units === "metric" ? kg : kgToLb(kg);
export const weightUnitLabel = (units: Units) =>
  units === "metric" ? "kg" : "lb";
