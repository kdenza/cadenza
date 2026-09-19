/**
 * Clamps a value into a range. Used by `cdz-range` and `cdz-progress`,
 * which wrap natives that clamp — but **not in the same way**, and the
 * difference decides what each component does with the result.
 *
 * A set-then-read table cannot tell the two apart; both look identical.
 * Raising the ceiling afterwards separates them, measured:
 *
 * ```
 * const p = document.createElement('progress');   // max 1
 * p.value = 500;  p.value;  // -> 1
 * p.max = 1000;   p.value;  // -> 500   value survived, clamped on GET
 *
 * const i = document.createElement('input');      // type=range, max=100
 * i.value = '500';  i.value;  // -> '100'
 * i.max = '1000';   i.value;  // -> '100'  value really was overwritten
 * ```
 *
 * So `<input type="range">` writes the clamp back and `<progress>` does
 * not: its IDL getter clamps against the current `max` while the stored
 * value survives, which is why it reappears when `max` moves.
 *
 * `cdz-range` therefore writes back and `cdz-progress` clamps for
 * display only, each matching its own native. An earlier version of this
 * file asserted both wrote back, on the strength of the table that cannot
 * distinguish them — see ADR-0032's correction.
 *
 * What both components had in common before either fix is still the
 * point: the number the platform drew and the number the component
 * reported could disagree. **A component's reported value is part of its
 * output.**
 */
export function clamp(value: number, min: number, max: number): number {
  // Bounds before the value, and this order is the whole point. Every
  // comparison with NaN is false, so a NaN bound slips past `max < min`
  // and then through Math.min/Math.max, and an entirely reasonable value
  // comes back NaN -- the component reporting a number that is not one,
  // which is the defect this helper exists to prevent, arriving through
  // the helper. Returning the value untouched is the conservative answer:
  // an unusable bound is not a reason to move a value that may be fine.
  if (Number.isNaN(min) || Number.isNaN(max)) return value;
  // A non-numeric value has no position in the range at all; the minimum
  // is the one answer that is certainly inside it.
  if (Number.isNaN(value)) return min;
  // An inverted range has no valid values. Collapsing to min keeps the
  // result inside the stated minimum rather than inventing one.
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}
