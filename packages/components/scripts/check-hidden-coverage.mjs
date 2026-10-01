#!/usr/bin/env node
/**
 * Makes hidden-attribute.test.ts's coverage claim true.
 *
 * That test asserts every component genuinely honours the `hidden`
 * attribute (ADR-0025). It walks a hand-written list, because the custom
 * element registry has no enumeration API — so the list can silently fall
 * behind while the file still looks exhaustive. Its docstring once claimed
 * it walked the registry; it never did, and cdz-radio-group was added
 * without coverage.
 *
 * This closes the gap from the other side: every tag defined in the source
 * must appear in that list. Same reasoning as check-test-fixtures.mjs — a
 * rule about source text, enforced in Node, before a browser starts.
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { walk, report } from './lib/sources.mjs';

// The scanned root, overridable so the guard can be run against a fixture
// tree instead of the real sources. Nothing in normal use passes it; it
// exists because a guard that has only ever passed has not been tested
// (ADR-0028), and scripts/check-guards.mjs is what tests this one.
const SRC = process.env.CDZ_GUARD_ROOT ?? new URL('../src/', import.meta.url).pathname;
const COVERAGE_FILE = join(SRC, 'shared/hidden-attribute.test.ts');

/**
 * Empty, and it has been wrong once. cdz-popover was exempted here on the
 * grounds that "its visibility is governed by the popover API, not by a
 * display on :host" -- but popover.styles.ts sets display on
 * :host(:popover-open), so the rule applied to it like everything else.
 * Measured: an open cdz-popover carrying `hidden` rendered at 62px while
 * a plain div[popover][hidden] stays display: none through showPopover().
 * The component was overriding behaviour the platform had got right, and
 * the exemption is what kept anyone from looking.
 *
 * An exemption is a claim about a component, and this file is the one
 * place nobody re-reads. Anything added here needs the measurement that
 * justifies it, not just a reason that sounds right.
 */
const EXEMPT = new Set();

const defined = new Set();
for await (const file of walk(SRC)) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(/customElements\.define\(\s*['"](cdz-[a-z-]+)['"]/g)) {
    defined.add(match[1]);
  }
}

const coverage = await readFile(COVERAGE_FILE, 'utf8');
const listed = new Set(
  Array.from(coverage.matchAll(/'(cdz-[a-z-]+)'/g), (m) => m[1])
);

const missing = [...defined].filter((tag) => !EXEMPT.has(tag) && !listed.has(tag)).sort();

report({
  problems: missing.map((tag) => `  ${tag}`),
  header:
    `${missing.length} component(s) define a custom element but are missing from\n` +
    'the TAGS list in src/shared/hidden-attribute.test.ts, so nothing checks\n' +
    'that they honour the hidden attribute (ADR-0025):',
  remedy: 'Add them to that list, or add to EXEMPT here with a reason.',
  ok: `✓ hidden-attribute coverage: ${defined.size - EXEMPT.size} components, none missing`
});
