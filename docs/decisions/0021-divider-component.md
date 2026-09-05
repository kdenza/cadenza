# ADR-0021: `<cdz-divider>` — the same default as `cdz-icon`, for the opposite reason

**Status:** Accepted
**Date:** 2026-08-02
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Second-to-last atom on the roadmap, and the simplest one left — but with
an accessibility decision that is not obvious and that also illuminates,
by contrast, one already taken.

## Decision

### A native `<hr>`, with its defaults reset

Measured before writing the CSS: an `<hr>` ships with **8px of block
margin**, `border: 1px inset` and zero height. All of it is reset, because
a design system's divider has to look the same in any context and not
inherit the browser's decisions.

### Decorative by default, semantic only on request

`<hr>` means "paragraph-level thematic break", and the platform maps it to
`role="separator"`. But **most lines in an interface are not thematic
breaks**: the one separating rows in a list, or dividing zones inside a
card, is visual furniture. A screen reader announcing "separator" once per
row turns a list into noise, and the cost multiplies with repetition —
something dividers do more than any other atom in this system.

So the default carries `role="none"`, and `semantic` re-enables the
genuine case: a real change of topic between sections.

### Why this does not contradict `cdz-icon`, though it looks like it

Both components land on "decorative by default", and the reasons are
**opposite**. Worth writing down because side by side they read like a
copied rule, and they are not:

- In `<cdz-icon>` (ADR-0016) the serious risk is on the silent side: a
  meaningful icon that goes unannounced leaves a control nobody can
  identify. The safe default is the decorative one *because it forces the
  important case to be declared explicitly*.
- Here the serious risk is on the noisy side: a decorative divider that
  gets announced repeats dozens of times. And the opposite failure is
  cheap — a silent semantic divider costs one structural hint, while all
  the content remains present and legible.

The rule they do share, and the one worth remembering instead of the
conclusion: **the default is the quieter option**. Which side is the quiet
one depends on the component.

### `aria-orientation` only when vertical *and* semantic

Horizontal is a separator's default value, so declaring it adds nothing;
and on a decorative rule, orientation means nothing at all. A test covers
all four combinations so that condition does not loosen by accident.

A vertical divider needs height from somewhere: inside a flex row it
stretches to match its siblings (`align-self: stretch`, with a
`min-height` fallback so it does not collapse), and in any other context
the consumer sets it. Verified on the site: the verticals between "Perfil
/ Ajustes / Salir" measure 1×22 px, not 1×0.

### No margin of its own

The space between the divider and what surrounds it belongs to the layout
containing both. It is the same reason no other atom in this system gives
itself margins, and the dogfooding proves it: both site demos space
themselves with `gap` from their container.

## Consequences

- **Easier:** a new divider does not force anyone to think about
  accessibility — the correct default is what you get by doing nothing.
- **To revisit:** no thickness or style variants (dotted, etc.). Nothing
  has asked for them, and `--cdz-divider-thickness` already allows a
  one-off adjustment without adding API.
- **To revisit:** no support for a divider with text in the middle
  ("── or ──"). It is a real pattern, but it involves slotted content and
  alignment decisions that make it closer to a molecule than to this atom.

## Action Items

1. [x] Measured the `<hr>` defaults in-browser before resetting them, and
   confirmed the vertical orientation holds reliably.
2. [x] `component/divider.tokens.json` — two tokens, both reusing existing
   roles.
3. [x] `<cdz-divider>` (Lit): native `<hr>`, `role="none"` by default,
   `semantic` for the real case, both orientations, no margin.
4. [x] Tests: a real `<hr>`, decorative by default, semantic on request,
   hot switching between the two, all four `aria-orientation`
   combinations, the browser defaults being reset, thickness in both
   orientations, absence of margin, and accessibility in all four states —
   213/213.
5. [x] Dogfooded on the site (horizontal in a column, verticals in a row)
   and in the gallery; verified the vertical measures 1×22 and does not
   collapse.
