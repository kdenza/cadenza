#!/usr/bin/env node
/**
 * Every `state: true` must also carry a literal `attribute: false`.
 *
 * At runtime the second is redundant — Lit's `state: true` already implies
 * it. The custom-elements-manifest analyzer is the reason it is not
 * optional: its plugin for the non-decorator `static properties` syntax
 * looks for the literal `attribute: false` and does not special-case
 * `state`. Without it, a private reactive field is published as a public
 * attribute in `custom-elements.json`, and the gallery draws a control for
 * it.
 *
 * cdz-select and cdz-file-input each carry a comment explaining this. Both
 * were written after someone hit it. cdz-avatar and cdz-page-nav were
 * written later and did not, and shipped `_imageFailed` and `_expanded` as
 * public API — confirmed by regenerating the manifest, not inferred.
 *
 * Which is the same story as ADR-0025's `hidden` and ADR-0028's fixtures:
 * a rule known by whoever hit it last, re-broken by whoever did not. A
 * comment in two files is not enforcement.
 *
 * Runs in Node, before a browser starts, for ADR-0028's reason — and
 * ahead of `cem analyze`, so the failure names the line rather than
 * appearing as a surprising entry in a generated artefact nobody reads.
 */
import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { walk, lineAt, report } from './lib/sources.mjs';

// The scanned root, overridable so the guard can be run against a fixture
// tree instead of the real sources. Nothing in normal use passes it; it
// exists because a guard that has only ever passed has not been tested
// (ADR-0028), and scripts/check-guards.mjs is what tests this one.
const SRC = process.env.CDZ_GUARD_ROOT ?? new URL('../src/', import.meta.url).pathname;

// A property declaration body: everything between `name: {` and its `}`.
const DECLARATION = /(\w+)\s*:\s*\{([^}]*)\}/g;

const offenders = [];
for await (const file of walk(SRC)) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(DECLARATION)) {
    const [whole, name, body] = match;
    if (!/\bstate\s*:\s*true\b/.test(body)) continue;
    if (/\battribute\s*:\s*false\b/.test(body)) continue;
    offenders.push(
      `  ${relative(SRC, file)}:${lineAt(source, match.index)} — ${name} is ` +
        '`state: true` with no `attribute: false`'
    );
  }
}

report({
  problems: offenders,
  header:
    `${offenders.length} reactive state field(s) will be published as public\n` +
    'attributes in custom-elements.json, because the manifest analyzer looks\n' +
    'for a literal `attribute: false` and does not special-case `state`:',
  remedy: 'Add `attribute: false` alongside `state: true`.',
  ok: '✓ state/attribute flags: every `state: true` declares `attribute: false`'
});
