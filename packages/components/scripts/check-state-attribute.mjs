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
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const SRC = new URL('../src/', import.meta.url).pathname;

// A property declaration body: everything between `name: {` and its `}`.
const DECLARATION = /(\w+)\s*:\s*\{([^}]*)\}/g;

async function* sources(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* sources(full);
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) yield full;
  }
}

const offenders = [];
for await (const file of sources(SRC)) {
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(DECLARATION)) {
    const [whole, name, body] = match;
    if (!/\bstate\s*:\s*true\b/.test(body)) continue;
    if (/\battribute\s*:\s*false\b/.test(body)) continue;
    const line = source.slice(0, match.index).split('\n').length;
    offenders.push(`  ${relative(SRC, file)}:${line} — ${name} is \`state: true\` with no \`attribute: false\``);
  }
}

if (offenders.length > 0) {
  console.error(
    `\n${offenders.length} reactive state field(s) will be published as public\n` +
      'attributes in custom-elements.json, because the manifest analyzer looks\n' +
      'for a literal `attribute: false` and does not special-case `state`:\n\n' +
      offenders.join('\n') +
      '\n\nAdd `attribute: false` alongside `state: true`.\n'
  );
  process.exit(1);
}

console.log('✓ state/attribute flags: every `state: true` declares `attribute: false`');
