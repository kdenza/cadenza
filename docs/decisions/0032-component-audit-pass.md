# ADR-0032: A per-component audit, and the three shapes it fell into

**Status:** Accepted
**Date:** 2026-09-16
**Deciders:** Cadenza design system owner (UX Engineer)
**Related:** [ADR-0014](0014-file-input-component.md), [ADR-0019](0019-progress-component.md), [ADR-0020](0020-tooltip-component.md), [ADR-0025](0025-hidden-attribute-and-host-display.md), [ADR-0026](0026-documentation-language.md), [ADR-0029](0029-radio-group-composition-that-breaks-semantics.md), [ADR-0030](0030-avatar-stack-when-composition-is-right.md), [ADR-0031](0031-lifecycle-symmetry-on-reconnect.md)

## Context

A review of every component, looking for correctness, technical debt and
anything that would be hard to read or change later. It returned 19
distinct defects across 14 components, the gallery guard scripts and the
site. All 300 tests were green the whole time.

That last fact is the finding. These were not exotic states. A range
whose thumb and readout disagreed. A select that could not be closed by
clicking the control that opened it. A checkbox that stayed ticked while
reporting itself unchecked. They survived review and a full suite because
of *how* they were tested, not because they were subtle.

ADR-0031 covers the lifecycle group and is not repeated here. What
follows is the rest, grouped by the three shapes they turned out to
share.

## Decision

### 1. A component may not lie about its own state

Six of the defects are one sentence: **the component reported something
other than what it rendered.**

| Component | Reported | Actually |
|---|---|---|
| `cdz-range` | `.value` 50, `<output>` 50, fill 500% | thumb at the maximum, 10 |
| `cdz-progress` | "150%" | a bar the browser drew full |
| `cdz-checkbox`/`radio`/`switch`/`radio-group` | `.checked` false | a ticked box, and `FormData` carrying it |
| `cdz-popover` | `.open` true | closed, and `hide()` could not repair it |
| `cdz-select` | `aria-expanded="true"` | a closed listbox |
| `cdz-page-nav` | `aria-expanded` on the host | nothing, on the element with the role |

The causes differ — an unclamped number, lit-html's dirty check, a
browser state change that fires no event, an attribute on the wrong
element — but the repair is the same in each: decide what the single
source of truth is, and make the component read it rather than a copy of
it.

Two of those sources are worth naming:

- **Where the platform holds the state, read the platform.** `cdz-select`
  reads `:popover-open` rather than `cdz-popover`'s mirrored `open`.
  `cdz-range` and `cdz-progress` clamp to match what the native controls
  do — measured first, because the design question was whether to clamp
  for display only or write the clamp back. Both natives write back, so
  both wrappers now do. Clamping for display alone would have fixed the
  visible half and left `.value` lying: **a component's reported value is
  part of its output.**

- **Where a binding can be bypassed, do not trust the binding.**
  lit-html skips a binding whose value has not changed since it last
  committed, which is correct until a *user* changes the DOM without going
  through it. Click a checkbox, revert `checked` in the listener, and the
  binding lands on the value already committed and does nothing — while
  the box stays ticked. The native state is now reasserted in `updated()`,
  where the dirty check does not reach it.

### 2. The shadow boundary: ADR-0029 and ADR-0030's rule needs a clause

`cdz-page-nav` put `aria-expanded` and `aria-controls` on the
`<cdz-button>` host. The host carries no role; the element assistive
technology treats as the button is inside its shadow root, and it had
neither. `aria-expanded` was easy to forward. `aria-controls` was not:
IDREFs resolve within one tree scope, and the list is in page-nav's
shadow root while the button is in cdz-button's — ADR-0020's finding, in
a third place.

By ADR-0029's rule that is a platform relation broken by a shadow root,
which says **do not compose**: page-nav should hand-roll its own button
and duplicate `cdz-button`'s styling. Measuring first said otherwise:

| direction | `ariaControlsElements` reads back |
|---|---|
| `cdz-button`'s shadow → page-nav's shadow (outward) | length 1 |
| light DOM → a shadow root (inward) | length 0, silently |

The second row is exactly what ADR-0020 recorded for
`ariaDescribedByElements`, now confirmed for a second relation. The first
is the new part.

> **The clause.** A relation a shadow root breaks for *IDREFs* can be
> restored with *element references*, outward. So composition survives
> where the atom is willing to accept the reference — which is why
> `cdz-button` gained `controls` (an element, never an id) rather than
> `cdz-page-nav` gaining a hand-rolled button.

ADR-0029 said composition is unsafe when the platform relates an element
to its siblings. That still holds. What this adds is that "the platform"
has more than one mechanism for the same relation, and they do not all
stop at the same boundary. Checking which one applies is the difference
between a correct composition and an unnecessary duplication.

### 3. Tests that pass because they never do what a user does

Every defect above sat under a green suite, and four of them under a test
written specifically to cover them:

- **`cdz-select`'s trigger could never close it.** Light dismiss runs
  between `pointerdown` and `click` — measured. So a real pointer had
  already closed the panel by the time `click` arrived, and `toggle()`
  reopened it. A synthetic `.click()` dispatches no pointer events and
  never triggers light dismiss, so the test opened it, closed it, and saw
  a mechanism no user can reach.
- **`cdz-page-nav`'s disclosure test asserted on the host** — the element
  that had the attributes, rather than the one that needed them.
- **`cdz-popover`'s `hidden` coverage** could not fail: a closed popover
  is `display: none` whether or not the component honours `hidden`
  (ADR-0025's amendment).
- **`cdz-button`'s centring assertion** measured exactly its own bound,
  `lessThan(0.5)` against 0.5 — red on correct layout. ADR-0019's table
  from the other direction: the tool said "broken" and was wrong.

This is ADR-0029's finding generalised. There it was synthetic key events
not driving native radio behaviour; here it is synthetic pointer events,
an assertion aimed at the wrong element, an assertion that cannot fail,
and an assertion with no slack. The common question is not "does this
test pass" but **"can this test fail, and for the reason I think?"**

Every fix on this branch was verified by running the new test against the
unfixed source first. Five of the 27 new tests would have passed either
way on first draft, and were rewritten.

## Consequences

- **19 defects fixed across 14 components, the guard scripts and the
  site.** 300 tests → 327, all green, and the `cdz-button` failure that
  was red in one environment is gone.
- **Two more `pretest` guards**, bringing the chain to four:
  `check-lifecycle-symmetry.mjs` (ADR-0031) and
  `check-state-attribute.mjs`. Both were rules already known — the second
  was documented in comments in two components and re-broken in the two
  written afterwards. A comment in two files is not enforcement.
- **`cdz-button` gained `expanded` and `controls`**, so the Disclosure
  pattern is supported by the atom rather than approximated by consumers.
  `expanded` is a string, not a boolean: `aria-expanded` has three
  meaningful states and Lit's Boolean converter would read
  `expanded="false"` as true.
- **Nothing here is a breaking change**, and the published packages are
  still at an unreleased `0.2.1`, so no further bump is needed. The
  behaviour changes are all in the direction of matching the platform.
- **To revisit:** `@kdenza/site` has no browser-test harness, so its two
  fixes are verified by the production build rather than by a test. That
  is the weakest verification on this branch and it is the site — the
  thing an employer actually opens.
- **To revisit:** the localisation rule from ADR-0026's amendment is the
  one finding that did *not* become a guard, because "is this string
  user-facing?" needs judgement a regex cannot supply. It will be
  re-broken; that is what conventions do here.
- **To revisit:** `cdz-file-input`'s `multipleText` takes a single
  template with `{n}`, which covers languages with one plural form for
  n > 1. A language with separate few/many forms cannot be served by it.

## Action Items

1. [x] Clamping in `cdz-range` and `cdz-progress` via `shared/clamp.ts`,
   matching the natives' measured write-back behaviour.
2. [x] `shared/checked-state.ts` reasserting native `checked` in
   `updated()` across all four checkable components.
3. [x] `cdz-select`: pointerdown snapshot so the trigger can close it, and
   no `change` when the value did not change.
4. [x] `cdz-button` `expanded`/`controls`; `cdz-page-nav` wired through
   them, with its test moved to the element that carries the role.
5. [x] `cdz-popover.open` reconciled in `show()`/`hide()`/disconnect;
   `cdz-tooltip` merges `aria-describedby` instead of overwriting it.
6. [x] Consistency: avatar-stack reads the avatar sizing tokens,
   `cdz-text` is loud on an unknown `as`, ids are module counters, and
   `state: true` carries `attribute: false` — that last one enforced.
7. [x] `cdz-file-input.multipleText`; ADR-0014 corrected and ADR-0026
   amended with the rule it turned out to be an instance of.
8. [x] Site: theme label follows OS changes, and storage access is
   guarded in `main.ts` and in both pages' pre-paint script.
9. [x] `cdz-button`'s centring tolerance set against the bug it catches
   (3.2px) rather than against zero.
