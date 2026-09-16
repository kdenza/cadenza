/**
 * Clamps a value the way the native controls this system wraps already do.
 *
 * Both natives clamp internally **and report the clamped number back** —
 * measured, not assumed:
 *
 * | | set | `.value` reads |
 * |---|---|---|
 * | `<input type="range" min="0" max="10">` | `50` | `"10"` |
 * | `<input type="range" min="0" max="10">` | `-30` | `"0"` |
 * | `<progress max="100">` | `150` | `100` |
 * | `<progress max="100">` | `-10` | `0` |
 *
 * The components wrapping them did neither, so the number the platform
 * drew and the number the component reported could disagree: a range
 * whose thumb sat at the maximum while its `<output>`, its `.value` and
 * its fill percentage all still said 50, and a progress rendering "150%"
 * beside a bar the browser had already drawn full.
 *
 * Clamping without writing back would only have fixed the display and
 * left `.value` lying to the consumer, which is the half-fix worth
 * naming: **the component's reported value is part of its output.**
 */
export function clamp(value: number, min: number, max: number): number {
  // A non-numeric value has no position in the range at all; the minimum
  // is the one answer that is certainly inside it.
  if (Number.isNaN(value)) return min;
  // An inverted range has no valid values. Collapsing to min keeps the
  // result inside the stated minimum rather than inventing one.
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}
