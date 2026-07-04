import { computeTargets, type Macros } from "./nutrition";
import { EXERCISES, exerciseById, type Metric } from "./exercises";
import type { AppState, FoodEntry, Profile, Workout } from "./types";

export interface ResolvedExercise {
  id: string;
  name: string;
  group: string;
  compound: boolean;
  custom: boolean;
  metric: Metric;
  bodyweight: boolean;
  defaultSec?: number;
}

/** Seeded library + the user's custom exercises, unified. */
export function resolvedExercises(state: AppState): ResolvedExercise[] {
  const base = EXERCISES.map((e) => ({
    id: e.id,
    name: e.name,
    group: e.group as string,
    compound: e.compound,
    custom: false,
    metric: e.metric,
    bodyweight: e.metric === "bodyweight",
    defaultSec: e.defaultSec,
  }));
  const custom = state.customExercises.map((c) => ({
    id: c.id,
    name: c.name,
    group: c.group,
    compound: false,
    custom: true,
    metric: c.metric,
    bodyweight: c.metric === "bodyweight",
    defaultSec: c.metric === "time" ? 30 : undefined,
  }));
  return [...base, ...custom];
}

/** How a movement is logged (seeded or custom). Defaults to weight. */
export function exerciseMetric(state: AppState, id: string): Metric {
  const c = state.customExercises.find((x) => x.id === id);
  if (c) return c.metric;
  return exerciseById(id)?.metric ?? "weight";
}

/** Whether a movement is loaded by bodyweight (seeded or custom). */
export function exerciseIsBodyweight(state: AppState, id: string): boolean {
  return exerciseMetric(state, id) === "bodyweight";
}

/** Default hold length (seconds) for a timed movement. */
export function exerciseDefaultSec(state: AppState, id: string): number {
  return exerciseById(id)?.defaultSec ?? 30;
}

/** Latest known bodyweight — most recent weigh-in, else the profile value. */
export function currentBodyweightKg(state: AppState): number {
  const last = state.weighIns[state.weighIns.length - 1];
  return last?.weightKg ?? state.profile.weightKg;
}

/**
 * True load moved for a set. For bodyweight movements this is
 * bodyweight + added weight, so pull-ups etc. show real strength trends.
 */
export function effectiveLoad(
  state: AppState,
  exerciseId: string,
  addedKg: number,
): number {
  switch (exerciseMetric(state, exerciseId)) {
    case "bodyweight":
      return currentBodyweightKg(state) + addedKg;
    case "band":
    case "time":
      return 0; // no external kg — excluded from volume/e1RM
    default:
      return addedKg;
  }
}

/** Total seconds spent on timed/mobility work in a workout. */
export function workoutStretchSeconds(state: AppState, w: Workout): number {
  return w.sets.reduce(
    (a, s) =>
      exerciseMetric(state, s.exerciseId) === "time"
        ? a + (s.durationSec ?? 0)
        : a,
    0,
  );
}

/** Resolve an exercise id (seeded or custom) to a display name. */
export function exerciseName(state: AppState, id: string): string {
  const c = state.customExercises.find((x) => x.id === id);
  if (c) return c.name;
  return exerciseById(id)?.name ?? "Exercise";
}

export function exerciseGroup(state: AppState, id: string): string {
  const c = state.customExercises.find((x) => x.id === id);
  if (c) return c.group;
  return exerciseById(id)?.group ?? "";
}

export function targetsFor(profile: Profile) {
  return computeTargets(profile);
}

export function sumMacros(entries: FoodEntry[]): Macros {
  return entries.reduce<Macros>(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function foodForDay(state: AppState, day: string): FoodEntry[] {
  return state.food.filter((f) => f.date === day);
}

/** Most recent prior sets logged for an exercise (for "last time" hints). */
export function lastSetsForExercise(
  state: AppState,
  exerciseId: string,
  excludeWorkoutId?: string,
) {
  const workouts = [...state.workouts]
    .filter((w) => w.id !== excludeWorkoutId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  for (const w of workouts) {
    const sets = w.sets.filter((s) => s.exerciseId === exerciseId);
    if (sets.length) return { date: w.date, sets };
  }
  return null;
}
