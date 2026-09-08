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
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const SRC = new URL('../src/', import.meta.url).pathname;
const COVERAGE_FILE = join(SRC, 'shared/hidden-attribute.test.ts');

/**
 * cdz-popover is out on purpose: its visibility is governed by the popover
 * API (:host(:popover-open)), not by a display on :host, so the rule the
 * test enforces does not apply to it.
 */
const EXEMPT = new Set(['cdz-popover']);

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(full);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) yield full;
  }
}

const defined = new Set();
for await (const file of files(SRC)) {
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

if (missing.length > 0) {
  console.error(
    `\n${missing.length} component(s) define a custom element but are missing from\n` +
      'the TAGS list in src/shared/hidden-attribute.test.ts, so nothing checks\n' +
      'that they honour the hidden attribute (ADR-0025):\n\n' +
      missing.map((tag) => `  ${tag}`).join('\n') +
      '\n\nAdd them to that list, or add to EXEMPT here with a reason.\n'
  );
  process.exit(1);
}

console.log(`✓ hidden-attribute coverage: ${defined.size - EXEMPT.size} components, none missing`);
