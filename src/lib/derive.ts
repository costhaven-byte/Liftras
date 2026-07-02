import { computeTargets, type Macros } from "./nutrition";
import { EXERCISES, exerciseById } from "./exercises";
import type { AppState, FoodEntry, Profile } from "./types";

export interface ResolvedExercise {
  id: string;
  name: string;
  group: string;
  compound: boolean;
  custom: boolean;
}

/** Seeded library + the user's custom exercises, unified. */
export function resolvedExercises(state: AppState): ResolvedExercise[] {
  const base = EXERCISES.map((e) => ({
    id: e.id,
    name: e.name,
    group: e.group as string,
    compound: e.compound,
    custom: false,
  }));
  const custom = state.customExercises.map((c) => ({
    id: c.id,
    name: c.name,
    group: c.group,
    compound: false,
    custom: true,
  }));
  return [...base, ...custom];
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
