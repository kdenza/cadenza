# ADR-0009: `<cdz-select>` — native dropdown, options as data, and a real styling ceiling

**Status:** Accepted
**Date:** 2026-07-28
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Sixth atom. Also the moment `ADR-0007`'s open item came due: the
required-`label` `console.error` pattern had already been copied verbatim
into three components (Input, Checkbox, Radio), and that ADR explicitly
flagged "worth reconsidering at the next form atom." This is that atom.

## Decision

### Shared utility extracted before writing a fourth copy

`packages/components/src/shared/required-label.ts` now holds
`warnIfLabelMissing(tagName, label)` — the exact check and message every
form atom needs. `<cdz-input>`, `<cdz-checkbox>`, and `<cdz-radio>` were
retrofitted to call it from their own `willUpdate()` instead of each
inlining the same `console.error` block; `<cdz-select>` uses it from
day one. Deliberately a **plain exported function**, not a class mixin:
a mixin would need generic TypeScript constructor typing to attach a
lifecycle method across unrelated base classes — real complexity for
what's a three-line check. A function that each component explicitly
calls from its own `willUpdate()` keeps the behavior fully visible in
each component's own file, consistent with this project's general bias
against hidden mechanism (no decorators, no `lit/static-html.js`, same
reasoning each time). All 47 existing tests still pass unchanged after
the retrofit — they assert observable behavior (`console.error` called
or not), not the internal implementation, so nothing about the public
contract moved.

### Native `<select>`, `options` as a JS property, not slotted `<option>`s

Same reasoning as every other form atom: the native element gets
keyboard navigation, type-ahead, and the Constraint Validation API for
free. What's different here, and worth calling out explicitly: `options`
is a `{ value, label, disabled? }[]` **property**, generated into
`<option>` elements inside this component's own `render()` — not
`<option>` children slotted in from the light DOM the way `<cdz-button>`
takes its label. This isn't a stylistic inconsistency; it's a real
platform constraint. No currently shipping browser renders `<option>`
elements provided through a `<slot>` inside a `<select>`'s shadow root —
there's an emerging "customizable select" proposal that would allow it,
but it isn't broadly supported yet. Generating `<option>`s from data
inside the shadow root is the only approach that reliably works today.

### A real, current styling ceiling — documented, not papered over

The *closed* control (the box before you click it) is fully restyled via
`appearance: none` plus a custom chevron, matching every other Cadenza
form field. The *open* dropdown list, once expanded, is rendered by the
browser/OS and **cannot be styled with CSS** in any mainstream browser
today. It will look like the platform's native popup, not like the rest
of Cadenza. This is the same category of honesty as `<cdz-radio>`'s
grouping limitation (ADR-0007) and `<cdz-text>`'s lack of document-wide
heading validation (ADR-0008): a real platform boundary, named in the
class comment rather than hidden or half-solved with a fragile custom
listbox.

### `placeholder` as a disabled, initially-selected option

When set, renders as `<option value="" disabled selected>` ahead of the
real options. Combined with `required`, the browser's own Constraint
Validation API correctly treats "still on the placeholder" as invalid
with zero extra script — the same "let the platform do the work" instinct
behind using native `<select>` at all.

### Gallery: array-typed props get no control, not a broken one

`options` doesn't fit any of the gallery's three control types
(enum-select, boolean-checkbox, free-text). Rather than render a text
input that looks editable but can't actually become a real array,
`@kdenza/gallery` now filters out any field whose manifest type text is
array-shaped (`[]` or `Array<...>`) before generating a control — the
value still arrives via `DEFAULT_PROP_OVERRIDES` for the live preview,
it's just not editable from the gallery UI. Consistent with ADR-0004's
own stated trade-off: the gallery is generic with known, named gaps, not
a hand-tuned control for every possible prop shape.

### Zero new tokens

`component/select.tokens.json` is entirely references into
`color.form.*`, `color.focus.ring`, and `typography.body/label/caption` —
the same tier `<cdz-input>` already established. The one new visual
element, the chevron icon, reuses `color.form.text.helper`/`disabled`
rather than inventing an icon-specific color role.

## Consequences

- **Easier:** the required-label pattern is now a one-line call per
  component instead of a paragraph to copy correctly each time — the next
  form atom (Textarea) is strictly less work because of this.
- **To revisit:** the placeholder-text color rule in `select.styles.ts`
  uses `:has(option[value=''] :checked)`, a relatively modern CSS
  selector. Fine for the evergreen-browser target this project already
  assumes (same assumption `:focus-visible` already relies on
  everywhere), but worth knowing if support requirements ever change.
- **To revisit:** the native open-dropdown-list styling ceiling isn't
  fixable by this component — if a fully on-brand open list ever becomes
  a real requirement, that's a from-scratch custom combobox
  (`role="combobox"` + `role="listbox"` + manual keyboard handling), a
  materially bigger undertaking than restyling `<select>`, not a follow-up
  to this ADR.

## Action Items

1. [x] Extracted `warnIfLabelMissing`; retrofitted Input/Checkbox/Radio;
   added a dedicated test for the shared utility itself — 47/47 passing
   before `cdz-select` was even added.
2. [x] `component/select.tokens.json` — verified zero new global/semantic
   tokens needed.
3. [x] `<cdz-select>` (Lit): native select + custom chevron, `options` as
   a property, placeholder-as-disabled-option, required-label check.
4. [x] Tests: label association, options rendered from data (respecting
   per-option `disabled`), accessible with options/placeholder/error,
   placeholder behavior, helper/error via `aria-describedby`, native
   disabled, change event, label-missing warning — 57/57 across all six
   components.
5. [x] Showcased on the design-system page and in `@kdenza/gallery`
   (including the array-prop control-filtering fix); verified in-browser
   against both color schemes.
