# ADR-0011: `<cdz-textarea>` — same pattern as `<cdz-input>`, one real new decision (resize)

**Status:** Accepted
**Date:** 2026-07-29
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Seventh atom, next on `docs/roadmap.md` after the `<cdz-popover>` detour.
Multi-line text entry is the same underlying need as `<cdz-input>` — a
labeled field, helper/error text, required/disabled — just backed by
`<textarea>` instead of `<input>`. The owner's own framing going in
("ya tenemos el input, luciría muy similar") matches what building it
confirmed: this is the most direct token/pattern reuse of any atom so
far, checkbox and radio included.

## Decision

### Tokens: zero new, not even a fork

`component/textarea.tokens.json` is `component/input.tokens.json`
verbatim, renamed to the `cdz-textarea` prefix — every value resolves
through the exact same semantic roles (`color.form.*`,
`color.focus.ring`, `typography.body/label/caption`, `spacing.2/3`,
`radius.3`). No new global or semantic token, no new component-specific
role. Confirmed by building and grepping the compiled CSS before writing
any component code, same discipline as every prior atom.

### ARIA pattern and component structure: copied from `<cdz-input>` intentionally

Label/field share a `for`/`id` pair, helper text and error message go
through `aria-describedby` (error replaces helper, doesn't stack with
it), `aria-invalid` on error, native `disabled` (excludes the value from
`FormData`, no "explain why this is unavailable" affordance to preserve
— same reasoning as every form field atom, still deliberately different
from `<cdz-button>`'s `aria-disabled`). Same required-`label`
`console.error` via the shared `warnIfLabelMissing` utility. None of this
needed rethinking; it's the same field pattern with a different native
element underneath.

### The one real new decision: `rows`, not `type` — and `resize: vertical`

`<textarea>` has no type variants, so `type` (input's actual point of
per-instance variation) is replaced by `rows` (native, controls initial
visible height, defaulting to `4` here rather than the browser's own
default of `2` — a plain UX call, not a platform constraint).

Resize behavior needed an explicit choice the native default doesn't
make well: native `resize: both` lets a user drag the field wider than
its container, which no other Cadenza field allows (an `<input>` can't
be widened by dragging either) and can visually break the surrounding
layout. Set to `resize: vertical` instead — width stays governed by the
container like every other field, but a user can still make a cramped
box taller, which is a real, common need a single fixed `rows` value
can't predict for every consumer. Disabled fields additionally get
`resize: none` — dragging a field you can't type into isn't a
meaningful affordance.

### Gallery: one line, not a new mechanism

`cdz-textarea`'s `label` is required the same way `cdz-input`/
`cdz-checkbox`/`cdz-radio`'s are — added one entry to the existing
`DEFAULT_PROP_OVERRIDES` map so its default gallery preview doesn't start
mid-warning. No new gallery mechanism needed; `rows` (a plain number)
already fits the existing boolean/enum/text-input control set with zero
changes.

## Consequences

- **Easier:** this is the fastest atom built so far — no new tokens, no
  new gallery mechanism, no new ARIA pattern to design from scratch.
  Confirms the three-tier token architecture and the shared
  `warnIfLabelMissing` utility are doing their job: a new form field is
  now mostly copy-the-shape-change-the-element, not
  design-everything-again.
- **To revisit:** `resize: vertical`'s default height (`rows="4"`) is a
  one-size guess; if a consumer needs a textarea sized to its expected
  content (e.g. a one-line "subject" vs. a long "body"), `rows` is
  already exposed per-instance to handle that — no follow-up needed
  unless a genuinely different sizing need (auto-grow-to-content, for
  instance) comes up later.

## Action Items

1. [x] `component/textarea.tokens.json` — verified zero new tokens by
   building and inspecting the compiled CSS before implementation.
2. [x] `<cdz-textarea>` (Lit): native `<textarea>`, `rows` property,
   `resize: vertical` (`none` when disabled), same ARIA/required-label
   pattern as `<cdz-input>`.
3. [x] Tests: label association, accessible (default/error/disabled),
   `rows` default and reflection, helper/error via `aria-describedby`,
   native disabled, input/change events, label-missing warning — 84/84
   across all components.
4. [x] Showcased on the design-system page (default+placeholder, helper
   text, required, error, disabled) and in `@kdenza/gallery`
   (`DEFAULT_PROP_OVERRIDES` entry added); verified in-browser against
   both color schemes and via the gallery's live a11y panel (zero
   violations).
