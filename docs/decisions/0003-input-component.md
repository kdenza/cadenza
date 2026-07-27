# ADR-0003: `<cdz-input>` — form field pattern, native disabled, and shared text roles

**Status:** Accepted
**Date:** 2026-07-21
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

First atom after Button, chosen deliberately (over Badge/Tag or an Icon
wrapper) because it has the richest accessibility surface of the
candidates — label association, error/helper messaging, required and
disabled states — and because a text field is the thing this portfolio's
own contact form will need soonest. Built with the same one-at-a-time,
fully-verified discipline as Button rather than sketching a full atom
inventory up front (Atomic Design informs the *taxonomy* — atoms before
molecules before organisms — not the pace).

Two things didn't exist yet and had to be designed before the component
could be built: a color that means "error" (none of lilac/rose/blue
conventionally reads that way), and a decision about whether Input's
disabled state should copy Button's `aria-disabled` pattern.

## Decision

- **New global hue: red, forked per mode like lilac was.** `color.red.600`
  (`#A73535`) for light mode, `color.red.400` (`#D96E68`) for dark — the
  same "vivid fill needs a lighter shade to stay visible on a near-black
  page" logic from ADR-0002 applies to text-on-page contrast just as much
  as fill-on-page. Breaking from the lilac/rose/blue palette for error
  specifically is deliberate: "red means error" is a convention strong
  enough that brand consistency should lose to it, not the other way round.
- **New semantic domain: `color.form.*`** (`border.default/error/disabled`,
  `background.default/disabled`, `text.helper/error/disabled`), forked
  light/dark the same way `color.action.primary.*` was. Kept separate from
  `action.primary` rather than merged — a form field's border states and a
  button's fill states are different enough concepts that sharing a
  namespace would blur what each token means.
- **New shared typography roles: `typography.body`, `typography.label`,
  `typography.caption`.** Button's `typography.button` was left completely
  untouched — these are new, independent semantic entries, not a refactor
  of what Button already references. `label` is medium-weight (matches
  Button's emphasis), `body` is regular-weight at the base size (the
  field's typed value), `caption` is regular-weight at a smaller size
  (helper/error text — a new `font.size.3` / `0.875rem` global token,
  alongside a new `font.weight.regular` / `400`). These are intentionally
  general-purpose — the next component that needs "some body text" or "a
  small caption" reaches for these rather than inventing its own.
- **Disabled state: native `disabled`, not `aria-disabled`.** This is a
  deliberate divergence from `<cdz-button>`, not an inconsistency:
  - Button's `aria-disabled` choice was about keeping a disabled *action*
    focusable and perceivable, since there's real value in an AT user
    discovering an action exists but isn't currently available.
  - A disabled form field doesn't carry that same case, and native
    `disabled` has a behavior `aria-disabled` can't replicate: it excludes
    the field's value from `FormData`/form submission. That's what you
    actually want for a disabled input — `aria-disabled` alone wouldn't
    stop a disabled field's stale value from submitting.
  - Documented directly in `input.ts`'s class comment so the divergence
    reads as intentional to the next person who reaches for `aria-disabled`
    out of habit from Button.
- **Label and description wiring is entirely internal to the shadow root.**
  `<label for="input">` / `<input id="input">` and
  `aria-describedby="helper-text"` or `"error-text"` all use fixed,
  non-generated ids — safe because each `<cdz-input>` instance has its own
  shadow root, which is its own id-scoping boundary. No id-uniqueness
  bookkeeping needed even with many instances of the component on one page
  (see the design-system page, which renders five). Error replaces helper
  text rather than showing both — both visually and in `aria-describedby`
  — and sets `aria-invalid="true"` only while an error is present.
- **Events are re-dispatched from the host, not left to bubble natively.**
  `_handleInput`/`_handleChange` construct new `Event('input'/'change', {
  bubbles: true, composed: true })` on the host element rather than relying
  on the native input event's own composition behavior — guarantees
  consumers outside the shadow root can listen exactly like they would on
  a plain `<input>`, without depending on exact per-event-type composed
  flags.

## Consequences

- **Easier:** the next atom that needs body/label/caption text — Badge,
  for instance — doesn't need to invent its own typography semantics.
- **Easier:** `color.focus.ring` (ADR-0002) paid off immediately — Input's
  focus state needed zero new decisions, just a reference to the same
  token Button uses.
- **To revisit:** this component does *not* implement the
  `ElementInternals`/form-associated custom element API (`attachInternals()`,
  static `formAssociated = true`). It fires `input`/`change` events and
  holds its own `value`, which is enough for the vanilla-JS site today, but
  it won't automatically appear in a native `<form>`'s `FormData` or
  participate in the Constraint Validation API the way a form-associated
  custom element would. Worth implementing once a real multi-field form
  (a molecule, or the portfolio's own contact form) needs native submission
  behavior rather than manually reading each field's `.value`.
- **To revisit:** `color.form.*` and `color.action.primary.*` both define a
  `disabled` background/text pair with overlapping-but-separately-declared
  values (same underlying neutrals, different token paths). Fine with two
  components; if a third introduces yet another disabled-state pair,
  consider whether a single cross-cutting `color.disabled.*` role is
  overdue instead of every component declaring its own.
- **To revisit:** only one input `type` variant was exercised in the
  showcase (text/email). `number`, `search`, `tel`, `url` are supported by
  the `type` property but haven't been visually checked — native browser
  chrome for some of these (e.g. `number`'s spinner buttons) may need
  their own token-driven styling before they're actually ready to ship.

## Action Items

1. [x] Global: `red.400`/`red.600`, `font.size.3`, `font.weight.regular`.
2. [x] Semantic: `color.form.*` (light + dark), `typography.body/label/caption`.
3. [x] `component/input.tokens.json`, `<cdz-input>` (Lit), styles, tests
   (label association, helper/error via `aria-describedby`, `aria-invalid`,
   required, native disabled, event re-dispatch) — all passing with
   axe-core in default/error/disabled states.
4. [x] Showcased on the design-system page (5 states); verified in-browser
   against both color schemes, computed values matching the token spec
   exactly.
5. [ ] Decide on `ElementInternals` form-association when a real form
   (molecule-level) needs it.

## Amendment (2026-07-22): required-label enforcement

`@cadenza/gallery` (ADR-0004) surfaced exactly the gap this ADR's original
scope left open: deliberately clearing `label` to test the a11y panel
produced a real, `critical`-severity axe finding ("Form elements must have
labels"), with nothing in the component itself pushing back on it.

`willUpdate()` now runs a check on every update (not just the first) and
`console.error`s a specific, actionable message whenever `label` is empty
— including when a previously-valid label gets cleared later, not just at
construction. Deliberately a `console.error`, not a thrown exception:
this is a misused-prop signal, not a fatal error, and a broken label on
one instance shouldn't be able to take down whatever else is on the page.
Three new tests lock this in: warns when missing, stays silent when a
label is provided, and warns again if a valid label is cleared after the
fact.

This also exposed a second-order issue in the gallery itself: its preview
instances start from each field's bare manifest default (`''` for
`label`), which meant the gallery's own default `<cdz-input>` preview was
permanently in the warning state. Fixed there with a small
`DEFAULT_PROP_OVERRIDES` map (mirroring the existing `SLOT_CONTENT`
pattern) so the gallery demonstrates a valid component by default, while
the `label` control can still clear it on demand to see the warning fire.
