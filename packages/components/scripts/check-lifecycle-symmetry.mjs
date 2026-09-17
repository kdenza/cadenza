#!/usr/bin/env node
/**
 * Guards the asymmetry that shipped in three components at once.
 *
 * A custom element's setup hooks and its teardown hooks do not run the
 * same number of times. `firstUpdated()` fires once per element, ever.
 * `disconnectedCallback()` fires on every unmount. So a component that
 * acquires in the first and releases in the second works exactly until
 * someone moves it -- a framework re-keying a list, a mount into a
 * dialog, any reparent -- and is then quietly inert for the rest of its
 * life. Nothing throws. The element still renders.
 *
 * cdz-select lost its popover `toggle` listener that way and went on
 * reporting aria-expanded="true" over a listbox the browser had already
 * closed; cdz-page-nav lost its IntersectionObserver and its scroll spy
 * with it. Both had been through review and had passing suites: every
 * test mounted an element and left it there, which is the one history no
 * real page has.
 *
 * Three rules, because the defect had two shapes and only the first is
 * about connect/disconnect:
 *
 *   1. A disconnectedCallback that RELEASES something needs a
 *      connectedCallback that does more than call super.
 *   2. Every removeEventListener('x') in disconnectedCallback needs a
 *      matching addEventListener('x') in connectedCallback.
 *   3. A component that resolves slotted content imperatively
 *      (assignedElements/assignedNodes) must wire @slotchange, or it has
 *      read its own children exactly once and will never look again.
 *
 * Rule 3 is the cdz-tooltip case, and it is worth being precise about
 * what that one was: its trigger listeners were never released on unmount
 * at all, so rules 1 and 2 would have passed it. Its bug was that a
 * trigger arriving after first render -- a conditional branch, an awaited
 * fetch, a host mounted before its children -- was never picked up, and
 * the component blamed the consumer's markup in the console on the way
 * past. Calling all three "the same bug" is how it nearly got one fix.
 *
 * What this does NOT catch: anything acquired in firstUpdated and
 * released nowhere, and any re-setup that is present but wrong. Rule 1 is
 * a coarse net -- it only asks that a connectedCallback exist and do
 * something, not that it do the right thing. A test is still the only
 * thing that proves behaviour; this proves the shape.
 *
 * Runs in Node, before a browser starts, for the reason ADR-0028 gives:
 * it is a rule about source text, and the browser cannot read the
 * sources.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const SRC = new URL('../src/', import.meta.url).pathname;

/**
 * Giving up a subscription. Deliberately excludes clearTimeout and
 * clearInterval: a timer scheduled by a hover or a keystroke SHOULD die
 * on unmount and must not be re-armed on reconnect, so requiring a
 * counterpart for those would be requiring a bug.
 */
const RELEASES = [
  /\.removeEventListener\s*\(/,
  /\.disconnect\s*\(\s*\)/,
  /\.unobserve\s*\(/,
  /\.abort\s*\(\s*\)/
];

/**
 * Escape hatch, matching check-hidden-coverage.mjs: 'path/file.ts#rule'.
 * Add a reason alongside any entry -- a component that legitimately owns
 * nothing past unmount is easier to read as a documented exemption than
 * as a silently passing file.
 */
const EXEMPT = new Set();

/**
 * Strips comments so a commented-out call can neither trip a rule nor
 * satisfy one. Tracks string and template literals so a `//` inside one is
 * not mistaken for a comment. Known limit: it does not recognise regex
 * literals, so a regex containing an escaped slash (/\//) would desync it.
 * There are none in src/ today; if that changes, this needs a real
 * tokeniser rather than a quiet wrong answer.
 */
function stripComments(source) {
  let out = '';
  let i = 0;
  while (i < source.length) {
    const two = source.slice(i, i + 2);
    if (two === '//') {
      while (i < source.length && source[i] !== '\n') i++;
    } else if (two === '/*') {
      i += 2;
      while (i < source.length && source.slice(i, i + 2) !== '*/') i++;
      i += 2;
    } else if (source[i] === '"' || source[i] === "'" || source[i] === '`') {
      const quote = source[i];
      out += source[i++];
      while (i < source.length && source[i] !== quote) {
        if (source[i] === '\\') out += source[i++];
        out += source[i++];
      }
      out += source[i++];
    } else {
      out += source[i++];
    }
  }
  return out;
}

/** The body of a method, by brace matching from its signature. */
function methodBody(source, name) {
  const signature = new RegExp(
    `(?:^|\\n)\\s*(?:(?:protected|private|public|override|static)\\s+)*${name}\\s*\\([^)]*\\)\\s*(?::[^{]*)?\\{`
  );
  const match = signature.exec(source);
  if (!match) return null;
  const open = match.index + match[0].length - 1;
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(open + 1, i);
  }
  return null;
}

/**
 * A method body plus the bodies of the `this._method()` calls it makes,
 * one level deep.
 *
 * Reading only `disconnectedCallback`'s own text was a real hole: moving
 * the teardown into a helper — the ordinary refactor once a
 * disconnectedCallback gets long, and something cdz-tooltip already does
 * with `_clearTimers()` — matched none of the release patterns, and the
 * component passed clean. Verified by planting exactly that shape: the
 * guard printed a tick and exited 0 on a component with the very defect
 * it exists to catch.
 *
 * One level rather than a full call graph: it covers the refactor that
 * causes this in practice, and a guard that tries to be an interpreter
 * acquires its own bugs. Deeper nesting is still a hole, and saying so
 * here is better than implying otherwise.
 */
function bodyWithCallees(source, name) {
  const own = methodBody(source, name);
  if (own === null) return null;
  let combined = own;
  for (const call of own.matchAll(/this\.(_\w+)\s*\(/g)) {
    const callee = methodBody(source, call[1]);
    if (callee !== null) combined += '\n' + callee;
  }
  return combined;
}

function lineOf(source, needle) {
  const at = source.indexOf(needle);
  return at < 0 ? 1 : source.slice(0, at).split('\n').length;
}

async function* sources(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* sources(full);
    else if (
      entry.name.endsWith('.ts') &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.styles.ts')
    ) {
      yield full;
    }
  }
}

const problems = [];
let checked = 0;
let skipped = 0;

for await (const file of sources(SRC)) {
  const raw = await readFile(file, 'utf8');
  const source = stripComments(raw);
  const name = relative(SRC, file);
  const exempt = (rule) => EXEMPT.has(`${name}#${rule}`);

  const disconnected = bodyWithCallees(source, 'disconnectedCallback');
  const connected = bodyWithCallees(source, 'connectedCallback');
  const readsSlot = /\.assigned(?:Elements|Nodes)\s*\(/.test(source);

  if (disconnected === null && !readsSlot) {
    skipped++;
    continue;
  }
  checked++;

  // Rule 1 -- a release needs a reconnect path that does something.
  if (disconnected !== null && !exempt('reconnect')) {
    const releases = RELEASES.some((pattern) => pattern.test(disconnected));
    const reconnects =
      connected !== null && connected.replace(/super\.connectedCallback\(\s*\);?/, '').trim().length > 0;
    if (releases && !reconnects) {
      problems.push(
        `  ${name}:${lineOf(raw, 'disconnectedCallback')} releases on unmount with no ` +
          `connectedCallback to re-establish it`
      );
    }
  }

  // Rule 2 -- listeners pair by event name.
  if (disconnected !== null && !exempt('listeners')) {
    const removed = new Set(
      Array.from(disconnected.matchAll(/\.removeEventListener\s*\(\s*['"]([^'"]+)['"]/g), (m) => m[1])
    );
    const added = new Set(
      Array.from(
        (connected ?? '').matchAll(/\.addEventListener\s*\(\s*['"]([^'"]+)['"]/g),
        (m) => m[1]
      )
    );
    for (const event of [...removed].sort()) {
      if (!added.has(event)) {
        problems.push(
          `  ${name}:${lineOf(raw, 'disconnectedCallback')} removes its "${event}" listener ` +
            `on unmount but never adds it back in connectedCallback`
        );
      }
    }
  }

  // Rule 3 -- slotted content resolved once is slotted content read once.
  if (readsSlot && !exempt('slotchange') && !/@slotchange/.test(source)) {
    // The stripped source, not `raw`: a comment mentioning the word earlier
    // in the file would otherwise decide the line number, and the number in
    // a guard's output is the part someone trusts.
    problems.push(
      `  ${name}:${lineOf(source, '.assigned')} reads its slotted children imperatively ` +
        `but never listens for @slotchange`
    );
  }
}

if (problems.length > 0) {
  console.error(
    `\nFound ${problems.length} lifecycle asymmetry/asymmetries.\n` +
      'Setup that runs once and teardown that runs on every unmount leaves a\n' +
      'component inert after any reparent, silently and without throwing.\n\n' +
      problems.join('\n') +
      '\n\nRe-establish it in connectedCallback (see cdz-popover for the shape),\n' +
      'or add to EXEMPT in scripts/check-lifecycle-symmetry.mjs with a reason.\n'
  );
  process.exit(1);
}

// The skipped count is named rather than left out: "4 components, none
// asymmetric" reads as "4 checked, all fine" when it means the other 18
// were never eligible for a rule in the first place.
console.log(
  `✓ lifecycle symmetry: ${checked} file(s) eligible, none asymmetric ` +
    `(${skipped} with no teardown and no imperative slot read were not checked)`
);
