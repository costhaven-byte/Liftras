/** Seeded exercise library — the movements people actually train. */

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Legs"
  | "Shoulders"
  | "Arms"
  | "Core"
  | "Mobility";

/**
 * How a movement is measured when you log it:
 * - "weight": external load on a bar/machine/dumbbell (the number you enter IS the load).
 * - "bodyweight": you are the load. The number you enter is ADDED weight
 *   (0 = pure bodyweight, positive = belt/plate, negative = band/machine assistance).
 * - "band": resistance band — logged by a level label (Light/Medium/Heavy), not kg.
 * - "time": held/timed movement (stretches, planks) — logged in seconds, not reps.
 */
export type Metric = "weight" | "bodyweight" | "band" | "time";

export interface Exercise {
  id: string;
  name: string;
  group: MuscleGroup;
  compound: boolean;
  metric: Metric;
  /** Default hold, for timed movements (seconds). */
  defaultSec?: number;
}

const x = (
  id: string,
  name: string,
  group: MuscleGroup,
  compound = false,
  metric: Metric = "weight",
): Exercise => ({
  id,
  name,
  group,
  compound,
  metric,
});

/** Same as `x` but flags the movement as bodyweight-loaded. */
const bw = (id: string, name: string, group: MuscleGroup, compound = false): Exercise =>
  x(id, name, group, compound, "bodyweight");

/** A resistance-band movement — logged by level label, no external kg. */
const band = (id: string, name: string, group: MuscleGroup): Exercise =>
  x(id, name, group, false, "band");

/** A timed hold (stretch/mobility/plank) — logged in seconds. */
const timed = (
  id: string,
  name: string,
  group: MuscleGroup,
  defaultSec = 30,
): Exercise => ({ id, name, group, compound: false, metric: "time", defaultSec });

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
  timed("plank", "Plank", "Core", 45),

  // Bands / home gym — logged by resistance level
  band("band-chest-press", "Band Chest Press", "Chest"),
  band("band-pull-apart", "Band Pull-Apart", "Back"),
  band("band-row", "Band Row", "Back"),
  band("band-lat-pulldown", "Band Lat Pulldown", "Back"),
  band("band-squat", "Band Squat", "Legs"),
  band("band-glute-kickback", "Band Glute Kickback", "Legs"),
  band("band-lateral-walk", "Band Lateral Walk", "Legs"),
  band("band-shoulder-press", "Band Shoulder Press", "Shoulders"),
  band("band-lateral-raise", "Band Lateral Raise", "Shoulders"),
  band("band-face-pull", "Band Face Pull", "Shoulders"),
  band("band-curl", "Band Curl", "Arms"),
  band("band-pushdown", "Band Triceps Pushdown", "Arms"),

  // Mobility / stretching — logged in seconds
  timed("hamstring-stretch", "Hamstring Stretch", "Mobility", 30),
  timed("hip-flexor-stretch", "Hip Flexor Stretch", "Mobility", 30),
  timed("couch-stretch", "Couch Stretch", "Mobility", 45),
  timed("pigeon-pose", "Pigeon Pose", "Mobility", 45),
  timed("childs-pose", "Child's Pose", "Mobility", 30),
  timed("thoracic-rotation", "Thoracic Rotation", "Mobility", 30),
  timed("shoulder-cross-stretch", "Shoulder Cross-Body Stretch", "Mobility", 30),
  timed("calf-stretch", "Calf Stretch", "Mobility", 30),
  timed("cat-cow", "Cat-Cow", "Mobility", 30),
  timed("worlds-greatest-stretch", "World's Greatest Stretch", "Mobility", 45),
  timed("dead-hang", "Dead Hang", "Mobility", 30),
];

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
  "Mobility",
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));
export const exerciseById = (id: string) => BY_ID.get(id);
