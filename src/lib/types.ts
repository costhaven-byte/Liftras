import type {
  ActivityLevel,
  Goal,
  Sex,
  Units,
} from "./nutrition";
import type { IntensityMode } from "./training";
import type { Metric } from "./exercises";

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
   * 0 for band/timed movements (they carry no external kg).
   */
  weightKg: number;
  reps: number; // 0 for timed movements
  mode: IntensityMode;
  value: number; // RPE or RIR value depending on mode
  /** For "time" metric: seconds held. */
  durationSec?: number;
  /** For "band" metric: resistance level label (e.g. "Medium"). */
  band?: string;
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
  metric: Metric; // how the movement is logged
}

/** One day inside a program — a label plus the exercises to do that day. */
export interface ProgramDay {
  id: string;
  label: string;
  exerciseIds: string[];
}

/** A user-authored program: a named set of days you cycle through. */
export interface Program {
  id: string;
  name: string;
  days: ProgramDay[];
}

/** A calendar assignment: on `date`, do program day `dayId`, and whether it's done. */
export interface ScheduleEntry {
  id: string;
  programId: string;
  date: string; // YYYY-MM-DD
  dayId: string | null;
  done: boolean;
}

export interface AppState {
  profile: Profile;
  weighIns: WeighIn[];
  workouts: Workout[];
  meals: Meal[]; // saved meal library
  food: FoodEntry[];
  templates: Template[];
  customExercises: CustomExercise[];
  programs: Program[];
  schedule: ScheduleEntry[];
}

export type { ActivityLevel, Goal, Sex, Units };
