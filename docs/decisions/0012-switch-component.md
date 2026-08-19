# ADR-0012: `<cdz-switch>` — `role="switch"` on a native checkbox, and a thumb color no single fixed value could cover

**Status:** Accepted
**Date:** 2026-07-29
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Eighth atom, next on `docs/roadmap.md` after Textarea. A toggle switch is
the same underlying binary on/off idea as `<cdz-checkbox>`, but WAI-ARIA
gives it its own real semantics (`role="switch"`, announced as "on/off"
rather than "checked/not checked") and its own visual language (a
sliding track + thumb, not a checkmark in a box).

## Decision

### Native checkbox + `role="switch"`, not a hand-rolled `role="switch"` div

Same reasoning `<cdz-checkbox>` already established: a real native
`<input type="checkbox">` keeps Space-to-toggle and form participation
for free. `role="switch"` only overrides what gets *announced* — the
browser still derives the exposed checked/unchecked state from the
input's own native `.checked` property automatically, exactly like it
already does for the default `role="checkbox"` a plain checkbox gets.
This is the WAI-ARIA APG's own recommended approach for a switch backed
by a real form control, and it meant zero new keyboard-handling code —
the entire component is styling and one `role` attribute on top of what
`<cdz-checkbox>` already proved out.

No `indeterminate`: a switch is strictly binary. `<cdz-checkbox>`'s
`indeterminate` handling (imperative property, no HTML attribute
equivalent) simply doesn't apply here and wasn't ported over.

### Tokens: zero new color roles, but a real verified finding behind that "zero"

`component/switch.tokens.json` reuses `color.form.border.default` (track
off), `color.action.primary.background.default` (track on — same role
`<cdz-checkbox>`'s checked fill uses), `color.focus.ring`, and the
existing `color.form.text.*`/typography roles. On the surface this looks
like the same "100% reuse" story as checkbox, radio, and textarea before
it. It nearly wasn't:

The thumb needs to stay visible against **four** different track colors
(off/on × light/dark), not the one or two combinations every prior atom's
checked-state color had to clear. Computed real contrast ratios (WCAG
relative luminance, not eyeballed) for the two obvious fixed candidates
before picking one:

| Thumb candidate | vs. light off (neutral.500) | vs. light on (lilac.700) | vs. dark off (neutral.400) | vs. dark on (lilac.500) |
|---|---|---|---|---|
| White | 3.95:1 ✓ | 6.08:1 ✓ | 2.69:1 ✗ | 2.75:1 ✗ |
| Ink (`#2C2230`) | 3.85:1 ✓ | 2.50:1 ✗ | 5.65:1 ✓ | 5.54:1 ✓ |

Neither a fixed white nor a fixed dark-ink thumb clears 3:1 against all
four combinations — each fails exactly the two combinations the other
one passes. The fix wasn't a new token: `color.action.primary.text.default`
— the exact role `<cdz-checkbox>`'s mark already uses — already forks
white (light mode) / ink (dark mode) for exactly this reason, per
ADR-0002's "vivid fill needs dark text" finding. Using it for the thumb
clears all four combinations for free. Verified directly in-browser
after implementation, not just by the math: read the actual computed
`background-color` of both track and thumb across all four
off/on × light/dark combinations before considering this done (see
Action Items).

**The general lesson, worth carrying into future atoms:** "reuse an
existing token" and "verify it actually clears contrast for this new
combination" are two different steps. This atom's tokens looked like a
copy-paste zero-new-tokens win going in; only checking the real numbers
confirmed the specific *choice* of which existing token to reuse for the
thumb wasn't arbitrary — a naive "just use white, checkboxes look fine"
guess would have shipped a switch invisible in dark mode.

### New dimensions, not new colors

`track-width` (2.25rem), `track-height` (1.25rem), and `thumb-inset`
(0.125rem) are literal component-tier values — a track's pill geometry
has no existing shared concept in the global spacing scale to reference,
same precedent as `border-width: 1px` being a literal at the component
tier in every prior form atom. `thumb-size` does reference
`{spacing.4}` — the same global token `<cdz-checkbox>`'s own size uses,
since "the size of the small interactive indicator" is a real shared
concept between the two components, unlike the track dimensions.

## Consequences

- **Easier:** confirms `<cdz-checkbox>`'s native-element choice generalizes
  — a second control built on the exact same "native input, restyled,
  role override where needed" recipe, with no new keyboard code.
- **Easier, going forward:** any future component with a "vivid fill,
  needs a light-or-dark foreground depending on mode" need should check
  `color.action.primary.text.default` first before inventing a new token
  — this is now the third place it's solved exactly this problem
  (button text, checkbox mark, switch thumb).
- **To revisit:** none identified — this atom's scope (a single labeled
  on/off toggle) is complete as built; a "switch group" or
  form-associated behavior would be the same deferred, shared gap every
  form atom already has (ADR-0003's action item 5), not something new.

## Action Items

1. [x] `component/switch.tokens.json` — verified via real contrast math
   (table above) that `color.action.primary.text.default` is the only
   candidate that clears all four track combinations; everything else
   reuses existing semantic roles unchanged.
2. [x] `<cdz-switch>` (Lit): native checkbox + `role="switch"`, track +
   thumb visual (sibling `<span>`, not a pseudo-element — same reasoning
   as `<cdz-checkbox>`'s mark), no indeterminate.
3. [x] Tests: label association, `role="switch"` present, accessible
   off/on/disabled, helper/error via `aria-describedby`, native disabled,
   change event — 93/93 across all components.
4. [x] Showcased on the design-system page (off, on, helper text,
   required + error, disabled × off/on) and in `@kdenza/gallery`;
   verified in-browser that the thumb is visible against all four
   track-color combinations by reading actual computed
   `background-color` values, not just trusting the math — and via the
   gallery's live a11y panel (zero violations).
