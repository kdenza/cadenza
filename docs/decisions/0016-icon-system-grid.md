# ADR-0016: Icon system — SVG over an icon font, a 24 grid, and normalising the three that already existed

**Status:** Accepted
**Date:** 2026-07-30
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Before building `cdz-icon` it had to be decided what an icon in Cadenza is
made of. The question came from the owner's prior experience: using a
Font Awesome-style icon font and customising from there, which is what her
previous job did.

There were also already three hand-written icons — `cdz-select`'s chevron,
`cdz-checkbox`'s check/dash and `cdz-link`'s external-link mark — created
at different times, with no rules in common.

## Decision

### SVG, not an icon font

Verified in the browser before deciding, not assumed:

- An icon font places its glyphs in Unicode's **Private Use Area** (Font
  Awesome's typical codepoint is `U+F015`). To the browser that **is
  text**, not a graphic: it leaves a meaningless character in the DOM,
  which is what a screen reader reads and what gets copied to the
  clipboard.
- The decisive failure mode: if someone activates their own font
  (OpenDyslexic for dyslexia, or Windows high contrast), the icon font
  **is replaced** and every icon becomes a random letter or an empty box.
  It breaks precisely for the people who turned that assistance on because
  they need it — unacceptable in a system whose premise is accessibility
  from every commit.

SVG also solves the customisation that motivated the original question
better: with `currentColor` the icon inherits its context's colour and is
tokenisable, supports multicolour, and scales crisply. An icon font limits
you to colour and size.

**A fair nuance:** the problem is the *webfont*, not Font Awesome. FA6
offers an SVG API, so that family would remain viable through it. It was
ruled out on licensing (the free icons are CC BY 4.0, i.e. mandatory
attribution in a public portfolio) and dependency weight, not on quality.

### Sprite sheets are ruled out by the shadow DOM

Verified: `<use href="#icon">` pointing at a sprite in the document **does
not cross the shadow DOM boundary**. The same markup rendered 20×19px in
the normal DOM and **0×0** inside a shadow root. Since every Cadenza
component lives in a shadow root, that architecture — very common in other
systems — is not viable here. Paths are imported as data from a shared
registry instead.

### The grid

| Rule | Value |
|---|---|
| Canvas | 24×24 |
| Live area | 20×20 (2 units of air) |
| Stroke width | 2, constant **relative to the canvas** |
| Caps and joins | round |
| Corner radius | 2 |

No `fill`: every icon is stroke only, so a single `currentColor` on the
`<svg>` colours everything and inherits from context for free.

**A correction to the rule, found while verifying:** the live area bounds
the **stroke**, not the path's geometry. A 2-unit stroke is centred on the
path, so it adds 1 unit per side; measuring with `getBBox()` alone
underestimates exactly that. The first wording of the rule did not say so
and produced false "passes".

### The drift that was corrected

The three existing icons, measured before normalising:

| Icon | Canvas | Stroke | Stroke ÷ canvas | Rendered stroke |
|---|---|---|---|---|
| chevron (`cdz-select`) | 12 | 1.5 | 12.5% | 1.5px |
| check (`cdz-checkbox`) | 16 | 2 | 12.5% | 2px |
| external-link (`cdz-link`) | 12 | 2 | **16.7%** | 2px |

Two canvases, two stroke widths, and one icon a third heavier than the
others — written, moreover, the same day this system was drafted, which
says plenty about how easily this drifts without written rules.

After normalising, all three measure identically in the browser: canvas
24, rendered box 16px, stroke 2 units → **1.33 real px** in all three
cases.

### `external-link` needed a manual correction

With the rules applied mechanically the icon still read heavier than the
rest: a **closed** shape carries more optical weight than an open stroke
even at the same bounds, and its extent reached right to the edge of the
live area (3→22) while chevron and check had room to spare. It was
redrawn one unit further in at the top and right (3→21, 3→20).

This is the part no rule automates: **optical balance is not arithmetic
balance**. A circle has to be slightly larger than a square to *look* the
same size, and a closed shape has to be slightly smaller than an open one.

It was found by rendering the whole set at 96px, side by side, with the
live area drawn on top — at 16px the problem was invisible. That contact
sheet is the real verification tool for icons, not a spot measurement.

### Render sizes were unified

The chevron went from 12px to 16px, and the external-link icon from
`0.75em` to `1em`, so all three render the same real stroke width. The
link one is sized in `em` on purpose: it is an inline icon and has to
scale with the sentence it lives in, for the same reason `cdz-link`
inherits its typography (ADR-0015).

## Consequences

- **Easier:** `shared/icons.ts` is already the registry `cdz-icon` will
  read (internal registry + `name` prop, the option chosen). The atom
  reduces to size, colour and accessible meaning.
- **Easier:** a new icon is now the mechanical application of written
  rules, not a decision from scratch.
- **To revisit:** the current set is four icons and all existed because a
  component needed them. The decision to draw by hand vs. take geometry
  from an MIT set (Lucide) remains open and gets decided with more icons
  on the table.
- **To revisit:** corner radius 2 is only exercised by `external-link`
  today. If a future icon needs a different radius, it is worth confirming
  the value is still right for the whole set before breaking the rule.
- **To revisit:** there is no automated test verifying that a new icon
  respects the live area. It is programmatically checkable (`getBBox()` +
  half the stroke) and would make a good guard, but it was done by hand
  here.

## Action Items

1. [x] Verified in-browser the two decisive facts: icon fonts' PUA
   codepoint, and that `<use>` does not cross the shadow DOM.
2. [x] Grid defined and written into `shared/icons.ts`, with the
   correction that the live area bounds the stroke and not the geometry.
3. [x] The three existing icons migrated to the registry; measured in the
   browser that all three render a 1.33px stroke (previously 1.5 / 2 / 2).
4. [x] `external-link` redrawn for optical balance after auditing it at
   96px with the live area overlaid.
5. [x] Build and full suite green (137/137) and visual verification in
   context for the three affected components.
6. [x] Build `cdz-icon` on this registry — see the amendment.
7. [ ] Evaluate a test that automatically verifies each registry icon's
   live area.

## Amendment (2026-07-30): `<cdz-icon>`

The atom wrapping the registry. It kept exactly three responsibilities —
size, colour and meaning — because the geometry and grid rules already
live in `shared/icons.ts`.

### Decorative by default, meaningful on request

The central API decision, and deliberately asymmetric:

- **No `label`** → the icon is decoration: `aria-hidden="true"`, no role,
  contributes nothing to the accessibility tree. That is right most of the
  time — the chevron beside "País", the check inside a checkbox and the
  external-link arrow all sit next to text that already says the same
  thing, and announcing them again is noise.
- **With `label`** → the icon is the only thing communicating that
  information: `role="img"` + `aria-label`. It exists for the icon-only
  control.

The default is the safe one on purpose. A decorative icon announced too
much is annoying; a meaningful icon that goes unannounced leaves a control
a screen-reader user cannot identify. And requiring the meaningful case to
carry a hand-written string is what forces that string to exist: an API
that inferred the label from `name` would say "external-link" aloud, which
is worse than nothing.

### Colour is not a prop

The SVG paints with `currentColor`, so the icon takes the text colour of
wherever it is and follows light/dark by itself. Verified in the browser,
not assumed: the same `<cdz-icon name="dash">` inside an error context
computed `rgb(217, 110, 104)` while the others computed
`rgb(240, 230, 234)`. That is the concrete payoff of having chosen SVG
over an icon font — a font could only ever have coloured the whole glyph
at once.

### Size scale

`sm` 16px · `md` 20px (default) · `lg` 24px, plus `inherit` (`1em`).
Measured in the browser: 16 / 20 / 24, with `inherit` giving 16px next to
16px text and 32px next to 32px text.

`inherit` is first-class rather than an override: `cdz-link`'s external
icon had already needed it (ADR-0015), so the need was demonstrated before
the option existed.

### The contact sheet now lives in the gallery

The audit that exposed `external-link`'s optical weight problem was done
with a temporary overlay injected by hand into the page. That same view
became a permanent section of `@kdenza/gallery`: every registry icon at
96px with the live area overlaid, generated from `shared/icons.ts` so a
new icon appears by itself. The `name` dropdown in the controls is
populated from the registry too.

It is the only place the gallery reads source code rather than the
manifest: icon names are data in a registry, not a TypeScript union the
analyzer can read, and hard-coding them would go stale at the first new
icon.

### An unknown name renders nothing and shouts

Same contract as the missing `label`/`href` checks: `console.error` with
the list of available names, never `throw`. Silently rendering an empty
box would turn a typo into a layout mystery.

### Tests

Twelve cases, including one that walks the **entire** registry and
verifies each icon renders on the shared grid — so a new icon added with a
different `viewBox` breaks the test instead of silently breaking optical
coherence. 148/148 in total.

## Amendment (2026-08-02): first batch drawn with the rules

Five new icons, chosen for what the roadmap's Feedback section will need:
`x`, `chevron-up`, `info`, `alert-circle` and `alert-triangle`. The set
reaches nine.

`chevron-up` shares an exact footprint with `chevron-down` (14×8 with
stroke), so a control that changes direction does not change weight.

The three status ones were drawn as **a family**, not as three separate
icons: same circle radius, same bar length, same total content height
(8→16). Only two things vary, and both mean something — the container says
how urgent it is (neutral circle, more urgent triangle), and the mark says
what type it is (`info` is an "i" with the dot on top; the alerts are "!"
with the dot below). Inverting that pair is what keeps `info` and
`alert-circle` from being the same icon twice.

### Two things that showed up while measuring

**The circles "overflowed" the live area, except they did not.** The audit
reported `insideLiveArea: false` for `info` and `alert-circle`. Measured
without rounding, the overflow was **0.003 units** on a 24 grid: the
browser's error from approximating arcs as Bézier curves. The triangle,
which is pure straight lines, measures exactly 2→22 with zero overflow.
The circles comply; the audit predicate was naive in comparing with an
exact `<=` against a number produced by flattening curves. The pending
live-area test (action item 7) needs a tolerance.

**The 16px legibility floor breaks for one pair, and drawing cannot fix
it.** `info` and `alert-circle` are not tellable apart at `size="sm"`.
What distinguishes them — which end carries the dot — occupies about 3
grid units, which at 16px is ~2 real px, below what a 1.33px stroke can
express.

Three redraws were tried (longer bar, more dot-to-bar separation, greater
separation with a short bar) by rendering the pairs alternating at 16px.
**None changed the outcome**, and that is what makes it a limit rather
than a drawing problem. At `md` (20px) and above the pair reads fine.

The rule that remains: **use `md` or larger when these two have to be
distinguished from each other by shape.** In practice the components that
will use them (badge, alert) always accompany the icon with text — which
is exactly why `cdz-icon` treats them as decorative by default: the icon
supports the message, it does not carry it. Colour also differs between
them, but as a second signal, never the only one (WCAG 1.4.1).

This is the same class of finding as `external-link`'s optical weight:
invisible at real size until you look with the right tool. The difference
is that the earlier one was fixable by redrawing and this one is not.
