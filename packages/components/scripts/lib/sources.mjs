/**
 * The machinery every `pretest` guard needs, in one place.
 *
 * Before this, each of the four guards carried its own recursive walker
 * (under four different names), its own line-number arithmetic and its own
 * reporting block. The walkers had already drifted apart:
 *
 * | guard | excluded `.test.ts` | excluded `.styles.ts` |
 * |---|---|---|
 * | `check-test-fixtures` | walked *only* tests | — |
 * | `check-hidden-coverage` | yes | **no** |
 * | `check-lifecycle-symmetry` | yes | yes |
 * | `check-state-attribute` | yes | **no** |
 *
 * Nothing depended on that difference, which is exactly why it went
 * unnoticed: it happened silently, and guard number five would have
 * inherited whichever copy it was pasted from.
 *
 * Extracted **after** `check-guards.mjs` existed, not before. Until the
 * guards had failing cases on record there was no way to tell whether
 * consolidating them changed a decision — which is the same reason
 * ADR-0023 compares generated artefacts against a baseline rather than
 * trusting that something still compiles.
 */
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Walks `.ts` files under `root`. Which kinds are yielded is stated at the
 * call site rather than left to whichever copy of the walker a guard
 * inherited.
 */
export async function* walk(root, { sources = true, tests = false, styles = false } = {}) {
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full, { sources, tests, styles });
      continue;
    }
    if (!entry.name.endsWith('.ts')) continue;
    if (entry.name.endsWith('.test.ts')) {
      if (tests) yield full;
    } else if (entry.name.endsWith('.styles.ts')) {
      if (styles) yield full;
    } else if (sources) {
      yield full;
    }
  }
}

/** 1-indexed line containing `index`. */
export function lineAt(source, index) {
  return source.slice(0, index).split('\n').length;
}

/**
 * Line of the first occurrence of `needle`, or 1 when absent.
 *
 * Pass the source a guard actually reasoned over — for a guard that strips
 * comments first, passing the raw text instead means a comment mentioning
 * the needle decides the number, and the number in a guard's output is the
 * part someone trusts.
 */
export function lineOfFirst(source, needle) {
  const at = source.indexOf(needle);
  return at < 0 ? 1 : lineAt(source, at);
}

/**
 * The one reporting shape all four guards already had: what is wrong, the
 * offending lines, then what to do about it. Each guard supplies its own
 * words; only the structure and the exit code live here.
 */
export function report({ problems, header, remedy, ok }) {
  if (problems.length > 0) {
    console.error(`\n${header}\n\n${problems.join('\n')}\n\n${remedy}\n`);
    process.exit(1);
  }
  console.log(ok);
}
