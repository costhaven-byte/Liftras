/** Small formatting helpers shared across screens. */

import type { Metric } from "./exercises";
import type { SetEntry } from "./types";

/** `plural(1,"set") → "1 set"`, `plural(3,"set") → "3 sets"`. */
export function plural(n: number, word: string, pluralForm?: string): string {
  return `${n} ${n === 1 ? word : pluralForm ?? word + "s"}`;
}

/** Seconds → `m:ss` (e.g. 45 → "0:45", 90 → "1:30"). */
export function mmss(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

/**
 * Compact label for the load of a single set.
 * Weighted → `"60"`. Bodyweight → `"BW"`, `"BW+20"`, or `"BW−15"` (assisted).
 */
export function loadLabel(addedKg: number, bodyweight: boolean): string {
  if (!bodyweight) return `${addedKg}`;
  if (addedKg > 0) return `BW+${addedKg}`;
  if (addedKg < 0) return `BW−${Math.abs(addedKg)}`;
  return "BW";
}

/**
 * The primary quantity for one set, by metric:
 * weight → "60", bodyweight → "BW+20", band → "Medium", time → "0:45".
 */
export function setLabel(s: SetEntry, metric: Metric): string {
  switch (metric) {
    case "band":
      return s.band ?? "Band";
    case "time":
      return mmss(s.durationSec ?? 0);
    case "bodyweight":
      return loadLabel(s.weightKg, true);
    default:
      return loadLabel(s.weightKg, false);
  }
}

/** The trailing unit/qualifier shown after `setLabel` for a set. */
export function setDetail(s: SetEntry, metric: Metric): string {
  if (metric === "time") return "";
  return `× ${s.reps}`;
}
