#!/usr/bin/env node
/**
 * Guards against a mistake this project has now made three times.
 *
 * `@open-wc`'s async `fixture()` awaits `elementUpdated`, which uses
 * `el.updateComplete` when the mounted element has one — a microtask — and
 * otherwise falls back to `nextFrame()`, i.e. `requestAnimationFrame`.
 *
 * A plain `<div>` wrapper has no `updateComplete`, so any test that mounts
 * one silently depends on the browser choosing to paint. A headless CI
 * runner does not reliably do that: such tests pass locally and time out
 * at mocha's 2s in GitHub Actions.
 *
 * It happened in avatar (ADR-0022), and then in icon and spinner, where it
 * kept CI red for four commits while every local run stayed green. Twice
 * it was fixed by hand, and twice the same shape reappeared elsewhere —
 * because a hand fix only covers the instance someone happened to see.
 *
 * This runs in Node rather than as a browser test on purpose: it is a rule
 * about source text, and the browser cannot read the test files. An
 * earlier attempt used Vite's `import.meta.glob`, which the esbuild-based
 * test runner does not implement — and the broken module was skipped
 * silently rather than failing the run.
 *
 * The fix in every case: `fixtureSync` for a non-component root, then
 * await the component's own `updateComplete`.
 */
import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { walk, lineAt, report } from './lib/sources.mjs';

// The scanned root, overridable so the guard can be run against a fixture
// tree instead of the real sources. Nothing in normal use passes it; it
// exists because a guard that has only ever passed has not been tested
// (ADR-0028), and scripts/check-guards.mjs is what tests this one.
const ROOT = process.env.CDZ_GUARD_ROOT ?? new URL('../src/', import.meta.url).pathname;

// `await fixture(` whose template opens with a tag that is not a cdz-*
// custom element.
const OFFENDING = /await\s+fixture(?:<[^>]*>)?\s*\(\s*(?:\r?\n\s*)?html`\s*<(?!cdz-)([a-zA-Z-]+)/g;

const offenders = [];
// The only guard that walks tests rather than sources.
for await (const file of walk(ROOT, { sources: false, tests: true })) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(OFFENDING)) {
    offenders.push(
      `  ${relative(ROOT, file)}:${lineAt(source, match.index)} mounts <${match[1]}>`
    );
  }
}

report({
  problems: offenders,
  header:
    `Found ${offenders.length} async fixture(s) mounted on a non-component root.\n` +
    'These depend on requestAnimationFrame and time out in headless CI.',
  // ADR-0028, not 0027: this said 0027 (cdz-page-nav, the first molecule)
  // from the day it was written, in the one sentence someone reads when
  // the guard stops them.
  remedy:
    "Use fixtureSync(...) and await the component's own updateComplete.\n" +
    'See packages/components/scripts/check-test-fixtures.mjs and ADR-0028.',
  ok: `✓ no rAF-dependent fixtures (${offenders.length} offenders)`
});
