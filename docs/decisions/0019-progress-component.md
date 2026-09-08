# ADR-0019: `<cdz-progress>` — native when semantics is all you gain

**Status:** Accepted
**Date:** 2026-08-02
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Third component in "Feedback", and the determinate counterpart to
`<cdz-spinner>` (ADR-0018). Unlike every previous atom, here the project's
"native first" principle deserved re-examining rather than being applied
out of habit.

## Decision

### Native, even though the usual argument does not apply

Every earlier decision in favour of the native element bought
**behaviour**: keyboard, dragging, form participation, validation. A
progress bar **has no behaviour** — it is the drawing of a number. So the
honest comparison was not "native vs reimplementing interaction", but:

- **Native `<progress>`**: semantics for free and guaranteed — the browser
  maps `role="progressbar"` and derives
  `aria-valuenow`/`valuemin`/`valuemax` from `value`/`max`. Cost:
  vendor-prefixed pseudo-elements per engine.
- **`<div role="progressbar">`**: three ARIA attributes written by hand.
  Cost: none for styling.

A far narrower margin than `<cdz-range>` had (ADR-0013). Native won on two
tiebreakers, not on the principle:

1. Platform-provided semantics **cannot fall out of sync** with the value.
   A hand-written `aria-valuenow` can go stale when someone updates
   `value` and forgets the attribute.
2. It keeps the styling cost **identical to the one already accepted** for
   range, instead of introducing a second approach to the same visual
   problem.

The cost is real and is paid: there are no standardised pseudo-elements —
verified that `::progress-bar` and `::progress-value` do not exist, while
the `::-webkit-*` pair does. The two engines also divide the work
differently, which is why the track colour appears twice in the CSS:
WebKit paints it on `::-webkit-progress-bar`, Firefox paints it on the
element itself and uses `::-moz-progress-bar` for the fill.

### Third false negative from a measurement tool

`getComputedStyle(el, '::-webkit-progress-bar')` returned `rgba(0,0,0,0)`
and `border-radius: 0px` for rules that **were in fact applying**. Settled
by looking: a screenshot showed the bar in lilac against the native blue,
with no ambiguity.

It is the third case in this project where programmatic measurement lies
and visual verification wins:

| Case | Tool | What happened |
|---|---|---|
| ADR-0015 | `getComputedStyle` on `:visited` | Deliberately reports the *unvisited* values, for privacy |
| ADR-0016 | `getBBox()` | Measures geometry without the stroke, and approximates arcs with 0.003 of error |
| ADR-0019 | `getComputedStyle` on prefixed pseudo-elements | Reports transparent for rules that do apply |
| ADR-0022 | `getBBox({ stroke: true })` | Chromium **accepts the option and ignores it**: no error, returns the geometric box |

The pattern that remains: **when a measurement contradicts what should be
happening, suspect the measurement first.** Every time, the code was fine.

The fourth entry is the worst of the four, which is why it is worth
keeping in mind: the other three return a plausible but wrong value; that
one accepts an option that makes it *look* like the right thing is being
measured. The test that unmasks it is the same in every case — find an
input whose correct result is impossible to mistake (a straight line with
a 2-unit stroke has to measure 2 tall, not 0).

### Determinate only — indeterminate is `cdz-spinner`

A `<progress>` without `value` is indeterminate, and this component
deliberately does not expose that. `appearance: none` — which custom
styling requires — **removes the native animation of the indeterminate
state**, so the result would be a bar that looks broken rather than busy.

Indeterminate work belongs to `<cdz-spinner>`, which already solves
`prefers-reduced-motion` for the animation that case needs (ADR-0018). A
test pins it: it verifies `position` is never `-1`, which is the value
that gives away an indeterminate `<progress>`.

### `valueText` for when the raw number is not useful

`aria-valuetext` is opt-in, not generated. A screen reader announcing "45"
during a file upload is technically accurate and useless; "45 of 100 MB"
is what the person needs. Only whoever consumes the component knows what
that number counts, so there is no way to derive it.

When it is not passed, the attribute is **omitted entirely** rather than
left empty: an `aria-valuetext=""` would override the announcement the
platform already makes correctly, with nothing. There is a test for that.

The visible readout (`showValue`) is `aria-hidden`: it duplicates what the
element already announces, and exposing it would make it say the value
twice.

## Consequences

- **Easier:** the determinate/indeterminate split is explicit across two
  components, rather than one component with a mode that behaves
  differently.
- **To revisit:** no status variants. Now that `color.status.*` exists
  (ADR-0017), an error or success bar is plausible — but colour alone
  cannot be what communicates that, so the non-chromatic signal would have
  to be settled first.
- **To revisit:** no `role="status"` and no change announcements. A bar
  announcing every percentage would be unbearable; announcing milestones
  (25%, 50%) is a product decision the atom cannot make.
- **To revisit:** the `::-moz-progress-bar` rules remain unverified in
  real Firefox, same as range's — this project's tooling is Chrome only.
  Same debt, same place it gets settled.

## Action Items

1. [x] Verified in-browser what can be styled on `<progress>` before
   deciding, including discovering that `getComputedStyle` lies about
   prefixed pseudo-elements.
2. [x] `component/progress.tokens.json` — reuses the same semantic roles
   as `cdz-range` (`form.border.default` for the track,
   `action.primary.background.default` for the fill).
3. [x] `<cdz-progress>` (Lit): native `<progress>`, required `label`,
   optional `valueText`, opt-in visible readout hidden from AT,
   determinate only.
4. [x] Tests: label/for association, platform-derived semantics (and that
   `aria-valuenow`/`role` are *not* written by hand), defaults, never
   indeterminate, custom `max`, accessible at several points,
   `aria-valuetext` present and absent, hidden readout, percentage against
   `max`, division by zero, and the label warnings — 185/185.
5. [x] Dogfooded on the site and in the gallery; verified in-browser that
   `position` gives 0.45 / 0 / 1 / 0.3 and that the displayed percentage
   is computed against the component's own `max`.
