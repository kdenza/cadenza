# ADR-0005: `<cdz-checkbox>` — native input, imperative indeterminate, zero new tokens

**Status:** Accepted
**Date:** 2026-07-22
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Third atom, picked over Badge/Icon for the same reason Input beat them
earlier: richest accessibility surface of the remaining candidates.
Checkbox specifically has one pattern neither Button nor Input needed —
**indeterminate** — which is a genuine, easy-to-get-wrong web platform
gotcha: `.indeterminate` has no HTML attribute counterpart, so it can't
be set declaratively the way `checked` can.

## Decision

- **Native `<input type="checkbox">`, restyled, not reimplemented.**
  `appearance: none` strips default paint; the element keeps every native
  behavior — Space-to-toggle, form participation, and (this is the part a
  `role="checkbox"` div would have to hand-roll and could get wrong)
  correct `aria-checked`/`aria-checked="mixed"` computation. The
  checkmark/dash is a sibling `<svg>`, toggled via `:checked`/`.is-indeterminate`
  sibling CSS selectors — not a `::before`/`::after` pseudo-element on the
  input itself, because generated content on replaced elements like
  `<input>` doesn't reliably render across browsers.
- **`indeterminate` set imperatively in `updated()`**, after the native
  input exists in the DOM — it's a JS-only DOM property. Interacting with
  the checkbox always clears it first, matching native platform behavior
  (verified with a dedicated test).
- **Native `disabled`, same reasoning as `<cdz-input>`.**
- **Same required-`label` enforcement as `<cdz-input>`** (ADR-0003
  amendment) — `console.error`, not throwing, on every update where label
  is empty. Copied deliberately rather than abstracted into a shared
  mixin/base class at this size (two components, three lines each) — worth
  revisiting if a fourth form-atom needs the identical check.
- **Zero new global or semantic tokens.** `component/checkbox.tokens.json`
  is 100% references into what Button and Input already established:
  checked state uses `color.action.primary.background.default` (the same
  lilac as Button's fill — checking a box reads as "activating," the same
  concept as a primary action), the mark color reuses
  `color.action.primary.text.default` (white light / ink dark — the same
  text-on-fill logic from ADR-0002 applies here too), and every border/
  helper/error/disabled/focus color, plus `typography.label`/`caption`,
  are the exact tokens `<cdz-input>` already uses. The only new value in
  the entire token tree is one dimension alias
  (`cdz-checkbox.size` → `spacing.4`, i.e. 1rem, for the box's width/height).

## Consequences

- **Validates the architecture, doesn't just extend it.** Two atoms in,
  ADR-0002/0003 predicted new components would mostly reuse existing
  semantic tokens rather than inventing their own; a third atom needing
  *no* new global/semantic tokens at all is the strongest evidence yet
  that the three-tier system is paying for itself.
- **Easier:** any future component with a "selected/active" visual state
  has a ready-made answer — reuse `color.action.primary.background.default`,
  don't invent a new "selected" color.
- **To revisit:** the required-`label` check is now duplicated verbatim
  in `<cdz-input>` and `<cdz-checkbox>`. Fine at two; a third form atom
  repeating it verbatim is the signal to extract a shared base class or
  mixin instead of copying it a third time.
- **To revisit:** no checkbox *group* concept exists (a "select all"
  parent driving several children's indeterminate state, or a fieldset/
  legend wrapper) — this ADR is scoped to a single standalone checkbox,
  which is the correct atom-level scope. A group is a molecule, built
  from these atoms later, not a variant of this component.

## Action Items

1. [x] `component/checkbox.tokens.json` — verified zero new global/semantic
   tokens needed.
2. [x] `<cdz-checkbox>` (Lit): native input + custom paint, imperative
   `indeterminate`, native `disabled`, required-label `console.error`.
3. [x] Tests: label association, accessible in unchecked/checked/
   indeterminate, `.indeterminate` has no reflected attribute, clears on
   interaction, helper/error via `aria-describedby`, native disabled,
   change event, label-missing warning (present/absent/re-triggered) —
   28/28 passing across all three components.
4. [x] Showcased on the design-system page (5 states) and in
   `@cadenza/gallery` (added to `DEFAULT_PROP_OVERRIDES`, zero other
   gallery code needed); verified in-browser against both color schemes
   and via a live axe-core run (12 rules, 0 violations).
