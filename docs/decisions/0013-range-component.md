# ADR-0013: `<cdz-range>` — the most fragmented native control to restyle, a reused contrast finding, and a real binding-order bug

**Status:** Accepted
**Date:** 2026-07-29
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Ninth atom, next on `docs/roadmap.md` after Switch. A slider is the atom
where "use the native element" matters most of any built so far: the
WAI-ARIA APG itself singles out a custom slider (drag handling, arrow-key
stepping, Home/End, Page Up/Down, all with correct `aria-valuenow`) as one
of the harder widgets to reimplement correctly. It's also, by a wide
margin, the most visually fragmented native control across engines.

## Decision

### Native `<input type="range">`, restyled with real vendor prefixes — verified, not assumed

Same "let the platform do the interaction work" reasoning as every other
form atom. What's different here: restyling it isn't a clean single
`appearance: none`. Checked directly in the Chrome this project tests
against, rather than trusting memory of a fast-moving CSS area:
`CSS.supports('selector(::slider-thumb)')` and the same check for
`::slider-track`/`::slider-fill` all returned `false`. The standardized,
unprefixed slider pseudo-elements aren't shipped yet anywhere. The
classic `::-webkit-slider-thumb` / `::-webkit-slider-runnable-track` pair
is confirmed supported and is what's actually used; the `::-moz-range-*`
rules are written from Firefox's long-stable, well-documented syntax but
weren't (and can't be) verified in this Chrome-only tooling environment
— an honest gap, named rather than silently assumed away.

This is a different *kind* of platform ceiling than `<cdz-select>`'s
(ADR-0009/0010): that one was "cannot restyle at all" (fixed later, at
real cost, by building `<cdz-popover>`). This one is "can fully restyle,
but only by duplicating rules per rendering engine" — fragile, not
impossible. Worth its own record because it's a materially different
trade-off, not a repeat of the select story.

### The fill is a gradient, not a shared "progress" pseudo-element

Firefox has `::-moz-range-progress` (a native filled-track element);
Chrome has no equivalent. Rather than maintain two different filling
mechanisms per engine, both engines' track rules use the same
`linear-gradient` two-stop-color technique, with the stop position driven
by a `--cdz-range-fill-percent` custom property set imperatively in
`updated()` (computed from `value`/`min`/`max` — not expressible as a
static CSS rule, since it depends on component state).

### Thumb color: the exact ADR-0012 finding, reused without re-deriving it

The thumb sits at the boundary between the fill and the (unfilled) track
and must stay visible against *both*, in both color schemes — the same
four-color problem `<cdz-switch>` solved (ADR-0012's contrast table:
`color.form.border.default` / `color.action.primary.background.default`,
light and dark), because it reuses the *identical* two roles for track
and fill. No new contrast math was run here; the existing table already
covers all four combinations, and `color.action.primary.text.default`
(same token, same reasoning) was applied directly. Verified in-browser
that the resolved custom properties match ADR-0012's values exactly in
both modes, rather than assuming the reuse carried over correctly.

### No `required` — deliberate, not a gap

Unlike every other form atom here, `<cdz-range>` has no `required`
property. A range input always has *some* numeric value — it defaults to
the midpoint of min/max and clamps on every interaction — so there is no
empty state for "required" to guard against. Documented directly in the
class comment so it reads as an intentional omission, not an oversight
someone might "fix" later by copying the pattern from another atom.

### A real bug, found by dogfooding a non-default range: attribute/property binding order

Testing with `min="0" max="1000" step="50" value="1000"` (deliberately
different from the native 0–100 default, not just another 0–100
example) surfaced a genuine bug: the rendered `<input>`'s actual value
came out as `100`, not `1000`, while the component's own `value` property
and the `<output>` correctly showed `1000`. Root cause: the template
bound `.value` *before* `min`/`max`/`step`, and lit-html applies bindings
in source order. On the element's first render, its native defaults are
`min=0`/`max=100` until those attribute bindings run — binding `.value`
first clamps `1000` against the still-default `max=100`, and nothing
un-clamps it afterward when `max` is subsequently set to `1000`. Fixed by
reordering the template so `min`/`max`/`step` bind before `.value`. A
regression test locks this in with the exact triggering shape (a max
above 100), not just a same-range custom-value case that wouldn't have
caught it.

**Worth generalizing:** this class of bug — native element state that
depends on *which order* multiple bindings apply within one render —
only shows up when a consumer's values genuinely differ from the native
element's own built-in defaults. Every previous atom's dogfooding
examples happened not to cross that line. The lesson for future atoms:
when a native element has its own non-trivial defaults (as `<select>`,
`<input>`, and now `<input type="range">` all do), include at least one
dogfooding example that deliberately differs from them, not only
representative "normal" values.

### Zero new color tokens; two new literal dimensions

`component/range.tokens.json` reuses `color.form.border.default` (track),
`color.action.primary.background.default` (fill),
`color.action.primary.text.default` (thumb — see above),
`color.focus.ring`, and the existing `color.form.text.*`/typography
roles. `track-height` (0.375rem) and `thumb-size` (1.25rem) are literal
component-tier values, same precedent as every prior atom's
`border-width: 1px` — a slider's own geometry has no existing shared
concept in the global scale to reference.

### Gallery: a real, if minor, type-correctness gap fixed alongside this atom

`buildControl()` only special-cased `boolean` before falling through to
a plain text input for everything else — including `number`-typed props,
which would then get the raw *string* from the text control's value
assigned directly onto the property. `<cdz-range>` is the first
component with `number` props central to its own behavior (the
fill-percent math), which is what surfaced this; the same gap silently
existed for `<cdz-textarea>`'s `rows`. Fixed by adding a `number` branch
(a real `<input type="number">`, coercing via `Number(...)` on input) —
small, mirrors the existing `boolean` branch exactly, and directly serves
this atom's own gallery verification rather than being unrelated scope
creep.

## Consequences

- **Easier:** confirms native-first restyling generalizes even to the
  hardest case (a slider) — the cost is duplicated vendor-prefixed CSS,
  not reimplemented interaction logic.
- **Easier, going forward:** any future atom needing a vivid-fill-vs-track
  thumb/indicator should check `color.action.primary.text.default` first
  — the fourth place it's solved this exact problem (button text,
  checkbox mark, switch thumb, range thumb).
- **To revisit:** the `::-moz-range-*` rules are unverified in this
  Chrome-only tooling environment. Real Firefox testing, whenever this
  project's browser matrix expands past Chromium, is the way to close
  that gap — not more reasoning from documentation.
- **To revisit:** no tick marks / `<datalist>` support. Not requested,
  and a real (if secondary) additional slice of vendor-specific styling
  (`::-webkit-slider-tick-mark` support is inconsistent) — deferred
  rather than spending effort on an unrequested feature with its own
  fragility.
- **Easier, going forward:** the gallery's number-input fix applies
  retroactively to any existing or future `number` prop, not just this
  atom's.

## Action Items

1. [x] `component/range.tokens.json` — confirmed zero new color roles by
   direct reuse of ADR-0012's already-verified four-combination table;
   two new literal sizing values.
2. [x] `<cdz-range>` (Lit): native range input, vendor-prefixed
   track/thumb pseudo-elements (verified via `CSS.supports` which
   pseudo-elements are actually supported), gradient-based fill, native
   `<output for>` for the live value, no `required`.
3. [x] Found and fixed a real attribute/property binding-order bug
   (`.value` clamping against the native default `max` before the real
   `max` attribute applied) via a deliberately non-default dogfooding
   example; added a regression test with the exact triggering shape.
4. [x] Fixed a related, pre-existing gallery gap: `number`-typed props
   were assigned as raw strings from a generic text control.
5. [x] Tests: label/output association, native default values (0/100/1/50),
   custom min/max/step/value, the binding-order regression, fill-percent
   calculation, accessible at default/arbitrary/disabled, helper/error via
   `aria-describedby`, native disabled, input/change events, label-missing
   warning — 106/106 across all components.
6. [x] Showcased on the design-system page (default, helper text, a
   non-default min/max/step case, an at-max error case, disabled) and in
   `@kdenza/gallery`; verified in-browser in both color schemes that the
   thumb stays visible against both fill and track, and confirmed the
   fixed binding-order bug no longer reproduces outside of tests.
