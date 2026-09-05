# ADR-0025: `:host([hidden])` is mandatory in any component that sets `display`

**Status:** Accepted
**Date:** 2026-08-20
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

The freshly deployed site was showing the "Ver la galería de componentes"
link, which points at `http://localhost:5174` and therefore carries
`hidden` outside development. In production it should not exist at all;
there it was, measuring 217×22 px.

The element **did have the attribute**. What failed was the CSS.

## Decision

### The cause

`[hidden] { display: none }` lives in the **browser's** stylesheet (UA
origin). A `:host { display: ... }` inside a component is an **author**
style. In the cascade, author beats UA. So any component that declares
`display` on its `:host` **silently disables `hidden`**.

The counterpart is a single rule, and it was missing from **all 18
components that set display**:

```css
:host([hidden]) {
  display: none;
}
```

`cdz-popover` is deliberately exempt: its visibility is governed by the
popover API via `:host(:popover-open)`, not by `display` on the host.

### The methodological error, which matters more than the fix

This suspicion **had already been raised earlier in the project, and was
withdrawn as mistaken**. The verification at the time concluded that
`hidden` did work. It did not: the check was wrong, and the wrong
conclusion was written down as a dismissed false positive.

It is the exact mirror of ADR-0019's lesson — "when a measurement
contradicts what should happen, suspect the measurement" — and deserves
stating in full, because the project only had half of it:

> Suspecting the measurement cuts **both ways**. A measurement that
> *confirms* what you want to hear deserves the same scrutiny as one that
> contradicts it. All four entries in ADR-0019's table are tools that said
> "broken" when things were fine. This is the first that said "fine" when
> things were broken, and that is exactly why it survived to production.

And a second one: **the deploy found the bug, not the suite.** 234 green
tests and none of them touched this, because they exercised components in
isolation and this failure only shows up when something actually *uses*
`hidden`. Same pattern as ADR-0024: putting the system in a new
environment exposes what the familiar one hides.

### One test for the whole system

`shared/hidden-attribute.test.ts` walks all 18 components and checks two
things for each: that computed `display` is `none`, and that the rect
measures 0×0. The second is not redundant — it measures *the result*
rather than *the intent*, which is precisely the distinction that let this
through.

A single file rather than 18 scattered cases: the rule belongs to the
system, not to each component, so a new component that forgets it fails in
one obvious place.

## Consequences

- **Impact on what is already published:** `@kdenza/components@0.1.0`
  shipped to npm with the bug in all 18 components. It warrants a `0.1.1`
  — a pure behaviour fix, no API change.
- **Easier:** `hidden` now works the way anyone would expect, without
  consumers having to discover they need `style="display:none"`.
- **To revisit:** the same class of collision affects other properties the
  UA applies and the author overrides. `:host` with `display` was the
  obvious case; whether there are others has not been audited.

## Action Items

1. [x] Audited all 19 components: 18 set `display` on `:host` and **none**
   had `:host([hidden])`.
2. [x] Added the rule to all 18, with a comment in each file explaining
   why (the rule alone is not enough — without the reason, someone deletes
   it for looking redundant).
3. [x] `shared/hidden-attribute.test.ts`: computed display and a 0×0 rect
   per component — 253/253, stable across five runs.
4. [x] Published `@kdenza/components@0.1.1` with the fix, verified against
   the published tarball in a clean project.
