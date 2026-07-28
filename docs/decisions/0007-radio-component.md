# ADR-0007: `<cdz-radio>` — native radio, and the shadow-DOM grouping limitation

**Status:** Accepted
**Date:** 2026-07-28
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Fourth atom, chosen over Switch/Badge/Icon specifically because it
introduces a pattern none of the first three needed: single-selection
*within a group*. That framing turned out to matter more than expected —
building it surfaced a real, load-bearing limitation of Web Components
that has to be designed around, not coded around.

## Decision

- **Native `<input type="radio">`, restyled via `appearance: none`** —
  same reasoning as `<cdz-checkbox>`: the native element keeps keyboard
  handling, form participation, and correct AT semantics for free, which
  a hand-rolled `role="radio"` implementation would have to reimplement
  and could get subtly wrong.
- **Documented, not worked around: native radio grouping doesn't cross
  shadow root boundaries.** Two native `<input type="radio">` elements
  sharing a `name` form a mutually-exclusive group with arrow-key
  navigation *only within the same DOM tree*. Each `<cdz-radio>` renders
  its `<input>` inside its own shadow root — a separate tree — so two
  `<cdz-radio>` instances sharing a `name` do **not** become a real group:
  checking one doesn't uncheck the other, and arrow keys don't move focus
  between them. This isn't a bug introduced by this implementation; it's
  inherent to how shadow DOM scopes native form-control grouping, and
  it's the same reason every serious Web Component design system ships a
  separate group/container component for radios rather than relying on
  bare `name` matching across instances.
- **Verified the limitation directly, not just asserted it**: a test
  creates two `<cdz-radio>` sharing `name="group"`, checks the second one,
  and asserts the first one is *still* checked — locking in the actual
  behavior as an expectation, so a future refactor can't silently "fix"
  this in a way that contradicts the documented design (it can only be
  properly solved by an explicit coordinating component, described below).
- **Demonstrated honestly on the design-system page**, not hidden: two
  `<cdz-radio name="plan">` sit side by side with a caption stating
  plainly that they don't exclude each other yet. Consistent with the
  page's own stated premise ("dogfooding real, no mockups") — showing a
  known gap in the open is more in keeping with that than only ever
  rendering non-conflicting examples.
- **No `required` property.** Unlike `<cdz-input>`/`<cdz-checkbox>`,
  "required" doesn't apply to a single radio in isolation — it's
  inherently a property of the *group* ("pick one of these"), not any one
  option. Adding it to this atom would misplace a concept that belongs on
  the future group component instead.
- **Circular shape (`border-radius: 50%`) is hardcoded**, not driven by
  the shared `--cdz-*-radius` token `<cdz-button>`/`<cdz-input>` reference
  — a round radio button is a fixed visual convention, not a themeable
  corner-radius choice.
- **The "dot" indicator is a plain sibling `<span>`** (background-color +
  border-radius), not an SVG like `<cdz-checkbox>`'s checkmark — a filled
  circle needs no path drawing. It also doesn't need a separate
  contrast-safe "mark" color the way the checkbox's checkmark does,
  because it sits on the transparent ring interior against the page
  background, not on a solid colored fill — so it directly reuses the
  same accent color as the ring instead of needing a white/ink pair.
- **Zero new tokens, again** — the fourth atom in a row that needed no
  new global or semantic additions. `component/radio.tokens.json` is
  entirely references into what Button/Input/Checkbox already
  established (`color.action.primary.background.default` for the
  checked ring and dot, `color.form.*` for borders/text, `color.focus.ring`
  for focus, `typography.label`/`typography.caption` for text).

## Consequences

- **Easier:** the checked-state color logic (ring + dot both using the
  single accent color, no separate "mark" color needed) is simpler than
  `<cdz-checkbox>`'s solid-fill-plus-contrast-color approach — worth
  remembering that not every "selected state" needs a two-color system;
  it depends on whether the indicator sits on a solid fill or a
  transparent one.
- **To revisit — this is the real one:** `<cdz-radio>` is correct and
  accessible used standalone (one option, no siblings), but is **not**
  sufficient the moment a consumer needs an actual mutually-exclusive
  group. That requires a `<cdz-radio-group>` *molecule* that owns
  selection state centrally, pushes `checked` down to its `<cdz-radio>`
  children, and implements roving tabindex + arrow-key navigation itself
  in JavaScript (listening for each child's `change` event and coordinating
  from there, since the native mechanism can't do it across shadow
  roots). This also means "required" and "name" as *group-level* concerns
  belong on that future component, not this one.
- **To revisit:** the same required-`label` `console.error` pattern is now
  duplicated a third time (Input, Checkbox, Radio) verbatim. Still not
  extracting a shared base/mixin — three components is closer to the
  point where that stops being premature, worth reconsidering at the next
  form atom rather than this one.

## Action Items

1. [x] `component/radio.tokens.json` — verified zero new global/semantic
   tokens needed.
2. [x] `<cdz-radio>` (Lit): native input + custom paint, no `required`,
   required-label `console.error`, shadow-DOM grouping limitation
   documented in the class comment.
3. [x] Tests: label association, accessible unchecked/checked, helper/error
   via `aria-describedby`, native disabled, change event, **the
   cross-instance grouping limitation itself** (verified, not assumed),
   label-missing warning (present/absent) — 37/37 passing across all four
   components.
4. [x] Showcased on the design-system page, including an honest
   side-by-side demonstration of the grouping limitation with two
   same-`name` radios; verified in-browser against both color schemes.
5. [ ] Build `<cdz-radio-group>` when an actual multi-option, mutually
   exclusive choice is needed somewhere (a molecule, not this atom).
