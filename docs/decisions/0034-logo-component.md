# ADR-0034: `<cdz-logo>` — the brand mark, and the first colour that ignores light/dark

**Status:** Accepted
**Date:** 2026-10-01
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Design handoff (`design_handoff_cadenza_logo/`) for the jacaranda mark: five
petals plus a blue centre, high fidelity, redrawn as vector paths from the
512px PNG the brand was originally drawn in (no vector original exists). The
handoff ships a React reference (`reference/Logo.reference.txt`) and static
SVG exports; the repo is Lit 3 + TypeScript without decorators, so this is a
port, not a copy — same shape as every other atom, following `badge.ts`'s
pattern as the handoff pointed at.

Two things made this different from the eighteen atoms before it:

1. Every other component's colours fork by mode through the semantic layer.
   This one's does not — the brand mark is meant to read the same in light
   and dark, which is a real exception to a rule that had held without one
   since ADR-0002.
2. The handoff left one decision open: which drawing the reduced mark (used
   below 28 painted pixels, `sm` today) should be — a lilac halo around the
   blue centre, or a shortened five-petal flower. Both were mocked up in
   `reference/logo-small-options.html`.

## Decision

### Brand colour gets its own semantic group, not a global reference

The handoff's own framing: either add a `color.brand.*` semantic group with
identical light and dark values, or document the exception inline and let
the component reference a global token directly. The semantic group was
chosen, for the same reason ADR-0017 gave `color.status.*` its own layer
instead of referencing `lilac.700` etc. from the component tokens directly:
**the "never skip the semantic tier" rule is about where a future change
gets made, not about whether the value currently varies by mode.** A
component token referencing `color.brand.mark.petal-primary` costs nothing
today and means a second brand-coloured surface (a loading splash, an
about-page hero) inherits the same slot instead of re-deciding it.

`color.brand.mark.{petal-primary,petal-secondary,petal-tertiary,petal-accent,center,halo}`
is defined **identically** in `color.light.tokens.json` and
`color.dark.tokens.json` — same global reference on both sides. The pipeline
still resolves global → semantic → component → CSS custom property for this
colour, it only happens to produce one number instead of two. No new global
colours were needed: `lilac-700`, `lilac-500`, `lilac-400`, `rose-500` and
`blue-500` already existed from ADR-0002 and matched the sampled PNG exactly,
with no rounding.

Petal roles are named by what they *are* (`petal-primary`, the unique
top/narrow one; `petal-secondary`, reused at 52° and 306°; `petal-tertiary`;
`petal-accent`, the rose one), not by which hue currently fills them. A
future repaint of the identity changes four token values, not five class
names and the component that uses them.

### The reduced mark: halo chosen over the shortened flower

**Option A (halo)** was taken. The handoff's own geometry section only ever
gives coordinates for the halo (`HALO = { cx: -0.3, cy: -32.2, outer: 129.2,
inner: 59.4 }`) — it's written as the implementation, with option B offered
as the comparison, not as a second spec. `Logo.prompt.md` gives the
tiebreaker directly: a solid disc reads larger than a flower with air
between its petals, so the halo is drawn 13% smaller than the full mark at
the same `size` and still holds at every size tested in
`logo-small-options.html` down to 16px, where the shortened-flower option
visibly starts to blur. The halo also degrades the drawing's *character*
honestly — it stops being a flower on purpose, rather than being a flower
that is merely too small to read as one.

**This is not re-litigated here with fresh measurements** — the owner asked
to see both before deciding, and the halo is what every other part of the
handoff (geometry, colour table, prompt rationale) already treats as
current. Revisit if that reading was wrong.

### `outline`'s reduced mark is an inferred default, not a specified one

The handoff states `outline` strokes the petals and keeps the centre filled,
and separately that `mono`'s reduced-mark halo is `currentColor` at 0.4
opacity — but never says what `outline` does below 28px, because there are
no petals left to stroke once the mark has become two circles. The
implementation treats `outline`'s reduced mark exactly like `mono`'s
(`currentColor`, halo at 0.4 opacity, centre solid), since "stroke the
petals" has nothing to apply to. Flagged here rather than asserted
silently, since it's a gap the spec didn't cover.

### Accessibility follows `cdz-avatar`'s split, not `cdz-icon`'s

`cdz-icon` *is* the `<svg>` — there's no wrapper, so its accessibility
attributes land on the SVG itself. `cdz-logo` renders an SVG plus an
optional wordmark `<span>`, so — like `cdz-avatar` — the role and label
belong on the element that actually wraps both: an inner `<span class="logo">`
in the shadow root, not reflected onto the host. The inner `<svg>` is
unconditionally `aria-hidden` and `focusable="false"`; it is never the
thing exposing the name, whether that's because the wrapper already claims
`role="img"` (no wordmark) or because the visible wordmark text already
says "Cadenza" (with wordmark — exposing the SVG too would read "Cadenza
Cadenza", the same double-announcement `cdz-badge`'s icon and `cdz-avatar`'s
fallback both avoid for their own reasons).

### Reduced-mark threshold stays a pixel rule, not a size-name rule

`REDUCED_BELOW = 28` is compared against a static `size → nominal px` table
(`{ sm: 20, md: 32, lg: 44 }`), matching the handoff's own reference
implementation, rather than measuring the rendered box. A layout read would
force a style/layout pass on every render for a value that is already known
at the moment `size` is chosen — there is nothing to measure that isn't
already implied by the API.

### Sizing tokens are `rem`, not the handoff's raw pixels

The handoff gives painted heights in px (20/32/44). Every other sizing
scale in this repo (`cdz-avatar`, `cdz-icon`) is `rem`, so `sm`/`md`/`lg`
became `1.25rem`/`2rem`/`2.75rem` — numerically identical at the default
root size, consistent with the rest of the system, and still a round number
each.

## Consequences

- **Easier:** any future brand-coloured, mode-invariant surface reuses
  `color.brand.mark.*` instead of reaching past the semantic tier.
- **Easier:** the petal role naming means repainting the identity is a
  token edit, not a component edit.
- **To revisit:** `outline`'s reduced-mark treatment is inferred, not
  specified — confirm with the owner if a real design for it ever shows up.
- **To revisit:** if option B (the shortened flower) turns out to be the
  intended favicon treatment after all, only the reduced-mark branch and
  its two circle radii change; the petal/colour work is unaffected either
  way.
- **To revisit:** no new icon-grid-style contact sheet exists for the mark
  the way ADR-0016 built one for icons — worth adding to the gallery if a
  second brand asset (e.g. a splash mark) is ever drawn.

## Action Items

1. [x] `color.brand.mark.*` added to both semantic colour files with
   identical values; no new global colours needed.
2. [x] `packages/tokens/src/component/logo.tokens.json`: colour, sizing
   (`rem`), typography (Figtree 600, `-0.01em`, one font-size per `size`),
   spacing (reuses `{spacing.2}`), and the outline stroke width (8).
3. [x] `<cdz-logo>` (Lit): `variant`, `size`, `with-wordmark`,
   `orientation`, `label`, `decorative`; reduced mark below 28 painted
   pixels (halo, Option A); `:host([hidden])` counterpart per ADR-0025.
4. [x] Exported from `packages/components/src/index.ts`.
5. [x] Added to the `hidden`-attribute systemic test's tag list
   (`src/shared/hidden-attribute.test.ts`), required by
   `scripts/check-hidden-coverage.mjs`'s `pretest` check.
6. [x] Tests: every variant renders; `sm` renders the reduced mark, `md`/`lg`
   render five petals; painted size per `size`; accessible name present
   without a wordmark, absent (silenced) with one, absent entirely when
   `decorative`; the inner SVG stays out of the accessibility tree either
   way; accessible across variants, with the wordmark, and decorative.
7. [x] `npm run analyze -w @kdenza/components` run to regenerate
   `custom-elements.json`.
8. [x] `assets/favicon-32.png` copied into `packages/site/public/` as the
   handoff asked. Not wired into the site's `<head>` — no `<link
   rel="icon">` exists yet in any of `site/src/*.html`, and the task as
   given was scoped to placing the file. Flagging rather than silently
   doing the rest.
