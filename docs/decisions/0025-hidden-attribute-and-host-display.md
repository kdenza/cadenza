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

## Amendment (2026-09-16): the 19th component, and the exemption that hid it

The audit above closed with "19 components: 18 set `display` on `:host`
and **none** had `:host([hidden])`". The nineteenth was `cdz-popover`, and
it was set aside because its `display` is not on `:host` — it is on
`:host(:popover-open)`. That reading then hardened into a coded
exemption in `scripts/check-hidden-coverage.mjs`, carrying the same
sentence as its justification: *its visibility is governed by the popover
API, not by a display on `:host`, so the rule does not apply to it.*

It does apply. Measured, a year of commits later:

| | closed | open |
|---|---|---|
| `<cdz-popover hidden>` | `display: none` | **`display: flex`, 62px** |
| plain `<div popover hidden>` | `display: none` | `display: none` |

The second row is the part that settles it. **The browser honours `hidden`
on a native `[popover]` element** — a plain div stays `display: none`
straight through `showPopover()`. `cdz-popover` was not exercising a
platform exemption; it was overriding behaviour the platform had got
right, which is the same shape as the original bug and not a special case
of anything.

### The rule has an ordering constraint in exactly one place

`:host([hidden])` and `:host(:popover-open)` have identical specificity
(0,2,0), so source order alone decides. Written where every other
component keeps it — near the top of the file, under `:host` — it parses,
reads correctly, and does nothing: the open popover still computed to
`display: flex`. It has to come **last**. Verified both ways round rather
than derived from the specificity arithmetic.

`cdz-popover` is the only component here whose `display` is
state-dependent, so it is the only one that has this constraint. That is
also why the original audit missed it: the criterion was "sets `display`
on `:host`", and this sets it on a *functional* `:host()`. ADR-0027 had
already had to restate the rule once, as being about any element given a
`display` rather than about `:host` specifically. This is the same
restatement arriving a second time, from the selector side.

### Listing a component is not the same as testing it

The sharpest part, and the reason the fix is not just deleting the
exemption. Adding `cdz-popover` to `TAGS` does **not** catch this bug. A
closed popover computes to `display: none` from the UA stylesheet whether
or not the component honours `hidden`, so the systemic test's
default-state assertion passes either way.

Verified directly: with the stylesheet left broken, the generic
`genuinely hides <cdz-popover>` case **passes**, and only a second test
that opens the popover first goes red.

> A coverage guard proves a component is on the list. It does not prove
> the assertion reaching that component is capable of failing. For every
> other component here those are the same thing, because their `display`
> does not depend on state — which is precisely what made the exception
> invisible.

This completes the pair. The original bug was a check that said "fine"
when things were broken. The exemption was a check that said nothing at
all and looked deliberate doing it. **An exemption is a claim about a
component, filed in the one place nobody re-reads.**

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
5. [x] *(2026-09-16)* `:host([hidden])` added to `cdz-popover`, last in the
   file, with the ordering constraint stated in the stylesheet. Exemption
   removed from `check-hidden-coverage.mjs`, which now runs with an empty
   `EXEMPT`; `cdz-popover` added to `TAGS`; and two tests that exercise the
   **open** state, since the systemic one cannot fail for this component.
   Verified against the unfixed stylesheet: the open-state test goes red,
   the generic one does not.
