# ADR-0018: `<cdz-spinner>` — the first that does announce itself, and the first with animation

**Status:** Accepted
**Date:** 2026-08-02
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Second component in "Feedback". Two things set it apart from the fourteen
before it: it is the first that must **announce itself** to assistive
technology, and the first with **animation** — that is, the first where
`prefers-reduced-motion` stops being optional.

## Decision

### It is a live region — and `<cdz-badge>` deliberately is not

The two decisions are opposites, taken a week apart, for a reason worth
writing down because it is what makes both of them correct:

- A **badge is content**. It is already there when the page renders.
  Wrapping it in `role="status"` would make every badge interrupt whatever
  the person is reading (ADR-0017).
- A **spinner is an event**. It appears *because something started*. That
  is exactly the case live regions exist for.

So this one renders `role="status"` — implicitly *polite*, never
*assertive*: cutting into what someone is reading is never justified by
"something is loading".

The SVG is `aria-hidden`; the visually hidden label carries the meaning.
The label is translatable, like `cdz-file-input`'s `triggerText`
(ADR-0014) and `cdz-link`'s new-tab notice (ADR-0015) — the application
owns its copy.

### Reduced motion: replaced, not stopped

Rotation is a classic vestibular trigger, so under
`prefers-reduced-motion: reduce` it disappears entirely rather than
slowing down.

What matters is that it is **replaced** by an opacity pulse instead of
simply being frozen, for two reasons: a frozen ring is indistinguishable
from a broken one, and the component's entire job is to say "this is still
running". An opacity change displaces nothing on screen, which is
precisely why the guidance targets *motion* rather than all animation.

**Verified by reading the CSSOM, not assumed from having written it:**

| Check | Result |
|---|---|
| Media rule condition | `(prefers-reduced-motion: reduce)` |
| Animation under that condition | `cdz-pulse` |
| `cdz-spin` keyframes | `100% { transform: rotate(360deg) }` → **moves** |
| `cdz-pulse` keyframes | `50% { opacity: 0.35 }` → **does not move** |

The accessibility claim ("under reduced motion there is no movement") is
proven against the real keyframes rather than written in prose. A test
pins it: it fails if someone replaces the pulse with `animation: none` or
leaves the rotation alive.

**A test of my own that was wrong and had to be fixed:** the first version
checked that the reduced-motion block did not contain the substring
`cdz-spin`. That fails as a false positive, because the token
`--cdz-spinner-reduced-motion-duration` **contains** that substring. It
was changed to a word-boundary check (`/\bcdz-spin\b/`), which does not
match `cdz-spinner` because `spin` is followed by a word character. The
code was always fine; the test was naive — the same class of error as the
live-area predicate in ADR-0016.

### Geometry reused from the icon system

A circle of radius 9 on the same 24 canvas as `info` and `alert-circle`
(ADR-0016), so a spinner placed where a status icon used to be changes
neither size nor weight.

The stroke does deviate: 2.5 instead of 2. A thin arc in motion reads as
flicker before it reads as a deliberate indicator. It is a conscious
departure from the icon system's rule, which is why it is stated here.

`pathLength="100"` normalises the circumference so the dash array reads as
a percentage (`25 75` = a quarter ring) instead of the computed decimal
(14.14 of 56.55).

The background ring uses opacity rather than a second colour token: a
fixed colour would break the moment the spinner landed inside a filled
button. Verified in the browser — the spinner inside `<cdz-button>`
computed `rgb(44, 34, 48)` while the standalone ones computed
`rgb(240, 230, 234)`, which is `currentColor` doing its job.

## Consequences

- **Easier:** the contrast between this decision and `cdz-badge`'s writes
  down the criterion for the rest of the Feedback section — is the
  component already there when the page loads, or does it appear because
  something happened? That decides whether it gets a live region.
- **Deliberately out of scope — no appearance delay.** A spinner that
  flashes for a 60ms request is worse than none, but the fix belongs to
  whoever knows how long the operation takes, not to the atom.
- **Deliberately out of scope — nothing announces the end.** Removing the
  spinner is silent. A flow that needs "done" has to say so itself; the
  atom cannot know whether it finished well or badly.
- **To revisit:** there is no determinate variant (with a percentage).
  That is `role="progressbar"` with `aria-valuenow`, different semantics
  and a different component — the Progress next on the roadmap.
- **To revisit:** live regions inside open shadow roots are announced
  correctly by current screen readers, but it is an area where support has
  historically varied. Worth a test with a real screen reader when one is
  available in this environment.

## Action Items

1. [x] `component/spinner.tokens.json`: sizes, stroke width, track opacity
   and the two durations (normal and reduced-motion).
2. [x] `<cdz-spinner>` (Lit): `role="status"` polite, translatable hidden
   label, `aria-hidden` SVG, geometry shared with the icon system,
   `currentColor`.
3. [x] Reduced motion solved by replacing the rotation with an opacity
   pulse, verified against the real keyframes via the CSSOM.
4. [x] Fixed a test of my own that gave a false positive by comparing
   substrings against a token name that contains them.
5. [x] Tests: polite live region, default and translated label, label
   hidden but present in the tree, hidden SVG, grid and `pathLength`,
   `currentColor`, size scale, default animation, and both reduced-motion
   checks — 170/170.
6. [x] Dogfooded on the site (sizes, inside a button inheriting colour)
   and in the gallery; verified in-browser that the sizes render 16/20/24
   and that colour is inherited from context.
