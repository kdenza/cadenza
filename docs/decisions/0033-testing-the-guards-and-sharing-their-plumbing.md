# ADR-0033: Testing the guards, and one walker underneath them

**Status:** Accepted
**Date:** 2026-10-01
**Deciders:** Cadenza design system owner (UX Engineer)
**Related:** [ADR-0023](0023-dependency-upgrade-pass.md), [ADR-0025](0025-hidden-attribute-and-host-display.md), [ADR-0028](0028-tests-that-depend-on-the-rendering-pipeline.md), [ADR-0029](0029-radio-group-composition-that-breaks-semantics.md), [ADR-0031](0031-lifecycle-symmetry-on-reconnect.md), [ADR-0032](0032-component-audit-pass.md)

## Context

By the end of ADR-0032 the repository had four `pretest` guards — Node
scripts that read `src/` as text and refuse the test run when an
architectural rule is broken. Each exists for the same reason: the rule was
already written down, in `CLAUDE.md` and in an ADR, and got re-broken
anyway by whoever had not personally hit it. ADR-0027 reintroduced
ADR-0025's `hidden` bug five commits after documenting it. A comment in two
files is not enforcement.

The guards were the answer to that. Nobody had asked the next question.

**All four had only ever passed.** Each was verified once, by hand, against
the defective sources it was written for — and those sources were then
fixed, in the same commit. So the evidence that a guard could fire stopped
existing the moment it was collected, and could not be re-run by anyone
afterwards. From that point on, every green tick was consistent with two
very different states of the world: a codebase with no violations, and a
guard that no longer fires at all.

ADR-0031 states the principle itself, quoting ADR-0028:

> A guard that has only ever passed has not been tested.

It is at line 150. The bullet immediately below it, introducing the guards,
said "three" when there were four — and had to be corrected a day later.
The gap between knowing a rule and the rule holding is the whole subject of
this repository's last six ADRs, and it reproduced inside the sentence
asserting it.

### It was not hypothetical

During review of that branch, a component was planted carrying the precise
defect `check-lifecycle-symmetry.mjs` exists to catch — acquire in
`firstUpdated`, release on every unmount, never re-establish — with one
change: the release moved one function call away, into a `_teardown()`
helper. The guard printed a tick and exited 0.

That is the shape of the failure to worry about. Not a guard that breaks
loudly, but one that keeps printing a tick after the thing it watches has
moved slightly. **A false green is worse than no guard**, because a tick
was printed and nobody looks again.

### And the four were four copies of one script

Separately, each guard carried its own recursive directory walker — under
four different names — its own line-number arithmetic, and its own
reporting block. The walkers had already drifted apart:

| guard | excludes `.test.ts` | excludes `.styles.ts` |
|---|---|---|
| `check-test-fixtures` | walks *only* tests | — |
| `check-hidden-coverage` | yes | **no** |
| `check-lifecycle-symmetry` | yes | yes |
| `check-state-attribute` | yes | **no** |

Nothing depended on the difference, which is exactly why it happened
silently. The cost was not the duplication; it was that **guard number five
would inherit whichever copy it was pasted from**, and which copy that is
carries no meaning.

## Decision

### 1. Test the guards, by exit code *and by which rule fired*

`scripts/check-guards.mjs` runs first in the `pretest` chain, before the
four it tests. It drives each guard over a fixture tree via a
`CDZ_GUARD_ROOT` environment override, and asserts, for all 11 cases:

- the **exit code**, and
- for a failing case, the **exact set of rules that fired**.

The second assertion is the one that matters. A guard that exits 1 for the
wrong reason is still broken, and the exit code cannot tell you that. Rules
are identified by a marker drawn from the text the guard actually prints —
so rewording a message without thinking about it fails this, which is the
right amount of friction for the one sentence a person reads when a guard
stops them.

It also fails on **any fixture directory no case claims**. Otherwise a
fixture can be added, never wired up, and sit there looking like coverage.

### 2. The fixtures are the sources that actually shipped broken

Pulled out of git history, not written to resemble defects:
`cdz-page-nav`'s unrebuilt observer, `cdz-select`'s unpaired `toggle`
listener, `cdz-tooltip`'s once-read slot, `cdz-avatar`'s `state: true`
without `attribute: false`, `cdz-popover` missing from the `hidden`
coverage list, and `icon.test.ts`'s rAF-dependent fixture. Each `pass/`
tree is the same file after its fix.

The reason is not authenticity for its own sake. **A hand-written fixture
can be wrong in the same way a hand-verification can** — it encodes what
someone believed the defect looked like. The pairing is the test: the guard
has to separate two versions of one real file, which is precisely what it
claims to do.

One fixture is hand-written and says so in its own file comment: the
delegated-teardown shape from review above, kept because the refactor that
produces it is ordinary — `cdz-tooltip` already delegates part of its
teardown to `_clearTimers()`.

### 3. One walker, with the file kinds stated at the call site

`scripts/lib/sources.mjs` holds `walk`, `lineAt`, `lineOfFirst` and
`report`. The four guards keep their own rules and their own words.
`walk()` takes `{ sources, tests, styles }`, so what a guard reads is a
decision at its call site rather than a property of which copy it
descended from.

Before narrowing `check-hidden-coverage` and `check-state-attribute` to
exclude `.styles.ts`, I checked that no `.styles.ts` file in the repository
contains `customElements.define` or `state: true` — so the narrowing loses
nothing across all 22 of them.

Stated plainly rather than spun: the four guards lose 41 lines and the
shared file adds 80, so **the total grows by 39.** The win is not line
count. It is that `readdir` appears once instead of four times, and the
next guard is a rule plus a `report()` call rather than a fifth copy of the
plumbing.

### 4. Order: the self-tests first, the extraction second

This was a dependency, not a preference. Until the guards had failing cases
on record, there was no way to tell whether consolidating four walkers had
changed a decision — only that the suite was still green, which it had been
throughout. The fixtures are what make the extraction *checkable* rather
than *plausible*.

So the refactor was verified the way ADR-0023 verifies a toolchain upgrade:
against a captured baseline, not by trusting that it still runs. 16
invocations, diffed byte for byte against `main` — the 5 real-source runs,
plus each guard over every fixture tree so the **failure** path is compared
too, since `report()` is exactly what got extracted. That is the output
nobody sees until something is already wrong.

Result: identical on 15 of 16, with one deliberate difference.

## The boundary this found, which is the part worth keeping

The one line that changed:

```diff
-See packages/components/scripts/check-test-fixtures.mjs and ADR-0027.
+See packages/components/scripts/check-test-fixtures.mjs and ADR-0028.
```

The rAF-fixtures rule is ADR-0028's subject; ADR-0027 is `cdz-page-nav`.
The guard had cited the wrong ADR since it was written, in the one sentence
a developer reads *at the moment it stops them* — pointing whoever hit it
at a document that does not explain the rule.

**The self-tests could not have caught this.** `check-guards.mjs`
identifies rules by marker and compares the set that fired. That is the
right design for what it tests, and deliberately so. But it means remedy
prose is outside its reach. The baseline diff is what found it.

So, concretely: **a guard's rules are now tested; the words it prints to
fix them are not.** That is a real limit on what decision 1 establishes,
and I would not have known to write it down before using the thing. It is
also ADR-0032's D6 class of error — a wrong ADR citation — surviving inside
a guard after the ones in the documentation had been fixed.

The transferable version is narrower than "test your tools": a test
asserts over the dimension you chose, and the dimensions you did not choose
stay exactly as unverified as before you wrote it. Naming what a green tick
does *not* cover is part of the test.

## Consequences

- **`pretest` is now five checks**, all in Node, before any browser starts:
  guard self-tests, rAF-dependent fixtures (ADR-0028), `hidden` coverage
  (ADR-0025/0029), lifecycle symmetry (ADR-0031), and `state: true` +
  `attribute: false` (ADR-0032).
- **A count in a document stays true only if it is derived.** The review
  that asked for this said "7 rules across the four guards"; its own table
  listed 1 + 1 + 3 + 1, and my reply repeated the 7 without adding it up.
  There are 6. `check-guards.mjs` now computes that number from its `RULES`
  map rather than stating it — the same failure ADR-0031's own miscount had
  already demonstrated, on the branch that introduced these guards.
- **Adding a rule is now two steps**, and the second is enforced: a
  `pass/` and `fail/` tree, then a marker in `RULES` and a case in `CASES`.
  A fixture with no case fails the run.

### Still not covered

- **The guards read source as text.** ADR-0031 already flagged that its
  comment stripper does not recognise regex literals, so a regex
  containing an escaped slash would desync it; there are none in `src/`
  today. Moving the rules onto an AST remains open, and the self-tests are
  what would make that migration verifiable rather than hopeful — the same
  relationship decision 4 describes.
- **Workspace version drift.** Found while fixing an unrelated advisory:
  the lockfile's `packages/components` entry said `0.2.1` while its
  `package.json` had said `0.3.0` since ADR-0032's branch. No check
  compares them — `npm ci` installs *from* the lockfile and never looks at
  the manifest. It is a candidate sixth guard, and a cheap one.
- **Message text.** Per the boundary above. A guard's prose is checked by
  whoever reads the diff, which is how this one was found and is not a
  mechanism.
