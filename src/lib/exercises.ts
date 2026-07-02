/** Seeded exercise library — the movements people actually train. */

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Legs"
  | "Shoulders"
  | "Arms"
  | "Core";

/**
 * How the movement is loaded:
 * - "weighted": external load on a bar/machine/dumbbell (the number you enter IS the load).
 * - "bodyweight": you are the load. The number you enter is ADDED weight
 *   (0 = pure bodyweight, positive = belt/plate, negative = band/machine assistance).
 */
export type LoadType = "weighted" | "bodyweight";

export interface Exercise {
  id: string;
  name: string;
  group: MuscleGroup;
  compound: boolean;
  load: LoadType;
}

const x = (
  id: string,
  name: string,
  group: MuscleGroup,
  compound = false,
  load: LoadType = "weighted",
): Exercise => ({
  id,
  name,
  group,
  compound,
  load,
});

/** Same as `x` but flags the movement as bodyweight-loaded. */
const bw = (id: string, name: string, group: MuscleGroup, compound = false): Exercise =>
  x(id, name, group, compound, "bodyweight");

export const EXERCISES: Exercise[] = [
  // Chest
  x("bench-press", "Bench Press", "Chest", true),
  x("incline-bench", "Incline Bench Press", "Chest", true),
  x("db-press", "Dumbbell Bench Press", "Chest", true),
  x("incline-db-press", "Incline Dumbbell Press", "Chest", true),
  x("cable-fly", "Cable Fly", "Chest"),
  x("pec-deck", "Pec Deck", "Chest"),
  bw("dips", "Chest Dips", "Chest", true),

  // Back
  x("deadlift", "Deadlift", "Back", true),
  bw("pull-up", "Pull-up", "Back", true),
  x("barbell-row", "Barbell Row", "Back", true),
  x("lat-pulldown", "Lat Pulldown", "Back", true),
  x("seated-row", "Seated Cable Row", "Back", true),
  x("db-row", "Dumbbell Row", "Back", true),
  x("t-bar-row", "T-Bar Row", "Back", true),
  x("straight-arm-pulldown", "Straight-Arm Pulldown", "Back"),

  // Legs
  x("back-squat", "Back Squat", "Legs", true),
  x("front-squat", "Front Squat", "Legs", true),
  x("rdl", "Romanian Deadlift", "Legs", true),
  x("leg-press", "Leg Press", "Legs", true),
  x("hack-squat", "Hack Squat", "Legs", true),
  x("bulgarian-split-squat", "Bulgarian Split Squat", "Legs", true),
  x("leg-curl", "Leg Curl", "Legs"),
  x("leg-extension", "Leg Extension", "Legs"),
  x("hip-thrust", "Hip Thrust", "Legs", true),
  x("calf-raise", "Standing Calf Raise", "Legs"),

  // Shoulders
  x("ohp", "Overhead Press", "Shoulders", true),
  x("db-shoulder-press", "Dumbbell Shoulder Press", "Shoulders", true),
  x("lateral-raise", "Lateral Raise", "Shoulders"),
  x("rear-delt-fly", "Rear Delt Fly", "Shoulders"),
  x("face-pull", "Face Pull", "Shoulders"),

  // Arms
  x("barbell-curl", "Barbell Curl", "Arms"),
  x("db-curl", "Dumbbell Curl", "Arms"),
  x("hammer-curl", "Hammer Curl", "Arms"),
  x("preacher-curl", "Preacher Curl", "Arms"),
  x("triceps-pushdown", "Triceps Pushdown", "Arms"),
  x("skullcrusher", "Skullcrusher", "Arms"),
  x("overhead-triceps", "Overhead Triceps Extension", "Arms"),

  // Core
  bw("hanging-leg-raise", "Hanging Leg Raise", "Core"),
  x("cable-crunch", "Cable Crunch", "Core"),
  bw("plank", "Plank", "Core"),
];

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));
export const exerciseById = (id: string) => BY_ID.get(id);
