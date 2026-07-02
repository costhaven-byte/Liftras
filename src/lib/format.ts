/** Small formatting helpers shared across screens. */

/** `plural(1,"set") → "1 set"`, `plural(3,"set") → "3 sets"`. */
export function plural(n: number, word: string, pluralForm?: string): string {
  return `${n} ${n === 1 ? word : pluralForm ?? word + "s"}`;
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
