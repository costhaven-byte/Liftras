/** Training intensity helpers — RPE ⇄ RIR and goal-based effort zones. */

export type IntensityMode = "rpe" | "rir";

/** Resistance-band levels, light → heavy. Used for band-metric exercises. */
export const BAND_LEVELS = [
  "X-Light",
  "Light",
  "Medium",
  "Heavy",
  "X-Heavy",
] as const;
export type BandLevel = (typeof BAND_LEVELS)[number];

/** RPE 10 = 0 RIR, RPE 9 = 1 RIR, … (RPE = 10 − RIR). */
export const rirToRpe = (rir: number) => Math.max(0, Math.min(10, 10 - rir));
export const rpeToRir = (rpe: number) => Math.max(0, 10 - rpe);

/**
 * Rule of thumb we surface in the UI: RPE for heavy low-rep strength work,
 * RIR for higher-rep hypertrophy work. Consistency matters more than which.
 */
export function suggestedMode(reps: number): IntensityMode {
  return reps <= 5 ? "rpe" : "rir";
}

export const EFFORT_ZONES = {
  strength: { label: "Strength", rpe: "8–10", rir: "0–2" },
  hypertrophy: { label: "Hypertrophy", rpe: "7–9", rir: "1–3" },
  recovery: { label: "Recovery", rpe: "4–6", rir: "3–5" },
} as const;

/** Estimated 1RM (Epley) — handy for per-exercise strength trends. */
export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}
