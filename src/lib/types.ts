import type {
  ActivityLevel,
  Goal,
  Sex,
  Units,
} from "./nutrition";
import type { IntensityMode } from "./training";

export interface Profile {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
  goal: Goal;
  units: Units;
  restTimerSec: number; // default rest between sets
  onboarded: boolean;
}

export interface WeighIn {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export interface SetEntry {
  id: string;
  exerciseId: string;
  /**
   * For weighted movements: the external load lifted.
   * For bodyweight movements: ADDED weight only — 0 means pure bodyweight,
   * negative means assisted (band/machine).
   */
  weightKg: number;
  reps: number;
  mode: IntensityMode;
  value: number; // RPE or RIR value depending on mode
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  startedAt: string; // ISO
  note?: string;
  sets: SetEntry[];
}

export interface Meal {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodEntry {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fromMealId?: string;
}

export interface Template {
  id: string;
  name: string;
  exerciseIds: string[];
}

export interface CustomExercise {
  id: string;
  name: string;
  group: string;
  bodyweight?: boolean; // logs added weight instead of external load
}

export interface AppState {
  profile: Profile;
  weighIns: WeighIn[];
  workouts: Workout[];
  meals: Meal[]; // saved meal library
  food: FoodEntry[];
  templates: Template[];
  customExercises: CustomExercise[];
}

export type { ActivityLevel, Goal, Sex, Units };
