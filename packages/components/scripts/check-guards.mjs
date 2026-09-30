#!/usr/bin/env node
/**
 * Tests the four `pretest` guards.
 *
 * ADR-0031 says it, four lines above a bullet that then undercounted the
 * guards it was introducing:
 *
 * > A guard that has only ever passed has not been tested (ADR-0028).
 *
 * That was true of all four. Each had been verified once by hand against
 * the sources it was written for — which were then fixed, so the evidence
 * stopped existing and could not be re-run. A guard that cannot fire looks
 * exactly like a codebase with no violations, and a false green is worse
 * than no guard at all, because a tick was printed and nobody looks again.
 *
 * It was not hypothetical. Review of that same branch planted a component
 * with the precise defect `check-lifecycle-symmetry.mjs` exists to catch —
 * acquire in `firstUpdated`, release on every unmount, never re-establish —
 * with the release moved one function call into a `_teardown()` helper. The
 * guard printed a tick and exited 0.
 *
 * ## What is asserted
 *
 * For every case: the guard's **exit code**, and for a failing case the
 * exact **set of rules** that fired. Comparing sets rather than "did it
 * fail" is the part that matters — a guard that exits 1 for the wrong
 * reason is still broken, and that is not visible from the exit code.
 *
 * ## Where the fixtures come from
 *
 * Almost all of them are the real defective sources, lifted out of git
 * history rather than written to look like defects — see
 * `__fixtures__/README.md` for which commit each came from. A hand-written
 * fixture can be wrong in the same way a hand-verification can; a source
 * that actually shipped broken cannot.
 *
 * Runs in Node, before a browser starts, for ADR-0028's reason.
 */
import { readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join } from 'node:path';

const run = promisify(execFile);
const SCRIPTS = new URL('.', import.meta.url).pathname;
const FIXTURES = join(SCRIPTS, '__fixtures__');

/**
 * A rule fires a line containing its marker. Identifying rules by the text
 * the guard actually prints keeps this honest: if someone rewords a
 * message without thinking, this notices, which is the right amount of
 * friction for the sentence a person reads when a guard stops them.
 */
const RULES = {
  'check-test-fixtures.mjs': { 'raf-root': 'mounts <' },
  'check-hidden-coverage.mjs': { 'missing-tag': 'define a custom element but are missing' },
  'check-lifecycle-symmetry.mjs': {
    reconnect: 'releases on unmount with no connectedCallback',
    'listener-pair': 'never adds it back in connectedCallback',
    slotchange: 'reads its slotted children imperatively'
  },
  'check-state-attribute.mjs': { 'state-attribute': 'with no `attribute: false`' }
};

const CASES = [
  { guard: 'check-test-fixtures.mjs', fixture: 'test-fixtures/pass', fires: [] },
  { guard: 'check-test-fixtures.mjs', fixture: 'test-fixtures/fail', fires: ['raf-root'] },

  { guard: 'check-hidden-coverage.mjs', fixture: 'hidden-coverage/pass', fires: [] },
  { guard: 'check-hidden-coverage.mjs', fixture: 'hidden-coverage/fail', fires: ['missing-tag'] },

  { guard: 'check-lifecycle-symmetry.mjs', fixture: 'lifecycle/pass', fires: [] },
  { guard: 'check-lifecycle-symmetry.mjs', fixture: 'lifecycle/fail-reconnect', fires: ['reconnect'] },
  // The real cdz-select released a listener it never re-added, so it trips
  // both: no reconnect path at all, and specifically an unpaired listener.
  {
    guard: 'check-lifecycle-symmetry.mjs',
    fixture: 'lifecycle/fail-listener',
    fires: ['reconnect', 'listener-pair']
  },
  { guard: 'check-lifecycle-symmetry.mjs', fixture: 'lifecycle/fail-slotchange', fires: ['slotchange'] },
  // The same two rules as fail-listener, reached through a callee rather
  // than the hook's own body. This is the case that was green until it was
  // planted in review.
  {
    guard: 'check-lifecycle-symmetry.mjs',
    fixture: 'lifecycle/fail-delegated',
    fires: ['reconnect', 'listener-pair']
  },

  { guard: 'check-state-attribute.mjs', fixture: 'state-attribute/pass', fires: [] },
  { guard: 'check-state-attribute.mjs', fixture: 'state-attribute/fail', fires: ['state-attribute'] }
];

function rulesFiredIn(output, guard) {
  return Object.entries(RULES[guard])
    .filter(([, marker]) => output.includes(marker))
    .map(([id]) => id)
    .sort();
}

const failures = [];

// Every fixture directory must be claimed by a case. Otherwise a fixture
// can be added, never wired up, and sit there looking like coverage.
const declared = new Set(CASES.map((c) => c.fixture));
for (const group of await readdir(FIXTURES, { withFileTypes: true })) {
  if (!group.isDirectory()) continue;
  for (const leaf of await readdir(join(FIXTURES, group.name), { withFileTypes: true })) {
    if (!leaf.isDirectory()) continue;
    const id = `${group.name}/${leaf.name}`;
    if (!declared.has(id)) failures.push(`  ${id} — fixture exists but no case runs it`);
  }
}

for (const { guard, fixture, fires } of CASES) {
  const shouldFail = fires.length > 0;
  let stdout = '';
  let stderr = '';
  let code = 0;
  try {
    ({ stdout, stderr } = await run(process.execPath, [join(SCRIPTS, guard)], {
      env: { ...process.env, CDZ_GUARD_ROOT: join(FIXTURES, fixture) + '/' }
    }));
  } catch (error) {
    code = error.code ?? 1;
    stdout = error.stdout ?? '';
    stderr = error.stderr ?? '';
  }
  const output = stdout + stderr;
  const label = `${guard} on ${fixture}`;

  if (shouldFail && code === 0) {
    failures.push(`  ${label} — exited 0; expected it to catch ${fires.join(', ')}`);
    continue;
  }
  if (!shouldFail && code !== 0) {
    failures.push(`  ${label} — exited ${code} on a fixture that should pass:\n${output.trim()}`);
    continue;
  }

  const fired = rulesFiredIn(output, guard);
  const expected = [...fires].sort();
  if (fired.join(',') !== expected.join(',')) {
    failures.push(
      `  ${label} — fired [${fired.join(', ') || 'none'}], expected [${expected.join(', ') || 'none'}]`
    );
  }
}

if (failures.length > 0) {
  console.error(
    `\n${failures.length} guard self-test failure(s). A guard that cannot fire is\n` +
      'indistinguishable from a codebase with no violations, which is why these\n' +
      'exist at all:\n\n' +
      failures.join('\n') +
      '\n'
  );
  process.exit(1);
}

const ruleCount = Object.values(RULES).reduce((n, rules) => n + Object.keys(rules).length, 0);
console.log(
  `✓ guard self-tests: ${CASES.length} cases over ${ruleCount} rules in ` +
    `${Object.keys(RULES).length} guards, each firing exactly what it should`
);
