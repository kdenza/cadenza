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
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = new URL('../src/', import.meta.url).pathname;

// `await fixture(` whose template opens with a tag that is not a cdz-*
// custom element.
const OFFENDING = /await\s+fixture(?:<[^>]*>)?\s*\(\s*(?:\r?\n\s*)?html`\s*<(?!cdz-)([a-zA-Z-]+)/g;

async function* testFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* testFiles(full);
    else if (entry.name.endsWith('.test.ts')) yield full;
  }
}

const offenders = [];
for await (const file of testFiles(ROOT)) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(OFFENDING)) {
    const line = source.slice(0, match.index).split('\n').length;
    offenders.push(`  ${relative(ROOT, file)}:${line} mounts <${match[1]}>`);
  }
}

if (offenders.length > 0) {
  console.error(
    `\nFound ${offenders.length} async fixture(s) mounted on a non-component root.\n` +
      'These depend on requestAnimationFrame and time out in headless CI.\n\n' +
      offenders.join('\n') +
      '\n\nUse fixtureSync(...) and await the component\'s own updateComplete.\n' +
      'See packages/components/scripts/check-test-fixtures.mjs and ADR-0027.\n'
  );
  process.exit(1);
}

console.log(`✓ no rAF-dependent fixtures (${offenders.length} offenders)`);
