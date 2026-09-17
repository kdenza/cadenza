/**
 * A per-prefix counter for generated names that must be unique within a
 * document — element ids, a fallback `name` for a radio set, a CSS
 * `anchor-name`.
 *
 * **Why a counter and not `Math.random()`.** Both are unique in practice.
 * Only the counter is *deterministic*, and that is what matters: a random
 * id churns the rendered markup between two otherwise identical renders,
 * which is hostile to snapshot tests and to any server-rendered output
 * that has to match what the client produces. `cdz-page-nav` and
 * `cdz-radio-group` both used `Math.random()` until ADR-0032's audit, and
 * the reasoning for replacing it ended up written out twice, in two
 * files, because there was nowhere to put it once.
 *
 * Counters are kept per prefix rather than globally so each component's
 * sequence stays readable — `cdz-tooltip-1`, `cdz-tooltip-2` — instead of
 * numbering that jumps according to what else happened to be constructed
 * first.
 *
 * Uniqueness holds within one module realm, which is the same scope the
 * four hand-rolled counters this replaces had. Two copies of the package
 * on one page would each start at 1; that was already true and is not
 * something a counter can fix on its own.
 */
const counters = new Map<string, number>();

export function nextId(prefix: string): string {
  const next = (counters.get(prefix) ?? 0) + 1;
  counters.set(prefix, next);
  return `${prefix}-${next}`;
}
