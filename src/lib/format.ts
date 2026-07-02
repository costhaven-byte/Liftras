/** Small formatting helpers shared across screens. */

/** `plural(1,"set") → "1 set"`, `plural(3,"set") → "3 sets"`. */
export function plural(n: number, word: string, pluralForm?: string): string {
  return `${n} ${n === 1 ? word : pluralForm ?? word + "s"}`;
}
