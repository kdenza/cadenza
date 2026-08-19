# ADR-0010: `<cdz-popover>` primitive + `<cdz-select>` rebuilt on it — restyling the select-only combobox popup

**Status:** Accepted
**Date:** 2026-07-28
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

ADR-0009 named the native `<select>` open-popup styling ceiling as a real,
current platform limitation and explicitly deferred fixing it: "if a
fully on-brand open list ever becomes a real requirement, that's a
from-scratch custom combobox... a materially bigger undertaking... not a
follow-up to this ADR."

That undertaking is this ADR — prompted by the owner's own idea, carried
over from a previous job's design system: a generic "popover"-style
primitive (there called something like "link-area") that covers *any*
trigger-plus-floating-content need — selects, menus, comboboxes — built
once and reused, rather than solving this narrowly for `<cdz-select>`
alone. Scoping it as a reusable primitive from the start, instead of a
select-only hack, is what makes the bigger undertaking worth it now.

## Decision

### `<cdz-popover>` — a new "Primitivos" category, not an atom

Lives outside the atom checklist in `docs/roadmap.md`: it's not a leaf UI
piece a consumer drops in directly, it's a building block other
components (`<cdz-select>` today, a future menu/combobox tomorrow)
compose internally. Deliberately **ARIA-agnostic** — it sets no `role` of
its own, because a listbox, a menu, and a combobox each need different
roles on the trigger and the slotted content, and baking one in would
make the primitive only work for whichever pattern came first.

Built on the native `popover` attribute (`type`, default `"auto"`) and
CSS Anchor Positioning, both verified directly in-browser rather than
assumed from memory (this corner of the platform is new enough, and
Chrome-specific enough today, that guessing was too risky):

- An `auto` popover gives light-dismiss (click-outside) and
  Escape-to-close for free — confirmed no listener code of this
  project's own is involved.
- Confirmed an `auto` popover with nothing `autofocus` inside does **not**
  steal focus from the trigger on open — required for the combobox
  pattern below, where real DOM focus must stay on the trigger the whole
  time.
- The `.anchor` property (a reference to the trigger element, not an
  attribute — it isn't serializable and usually isn't even in this
  element's own tree) wires `anchor-name`/`position-anchor` between the
  trigger and this element via **JS-set inline styles**, not a `:host`
  rule in this component's own stylesheet. This is a real, non-obvious
  platform constraint found by direct testing: `position-anchor` resolves
  a *tree-scoped* name, and a name declared in `cdz-popover`'s own
  shadow-root stylesheet does not resolve when the anchor element lives
  in a different shadow root (e.g. `cdz-select`'s). Setting both
  properties as inline styles via JS, on the actual elements, works
  regardless of which class's code set them — tree scope is a DOM
  property of the element, not a JS-authorship one.
- Anchor Positioning isn't universal yet (effectively Chromium-only
  today, same ceiling ADR-0009 already named for the old select popup).
  Feature-detected via `CSS.supports('position-anchor', ...)`: where
  it's missing, `show()` falls back to a one-time
  `getBoundingClientRect`-based placement that doesn't track
  scroll/resize afterward — a real, documented scope limit, not an
  oversight (see Consequences).

**A genuinely pleasant surprise, verified rather than assumed:** Chrome
applies automatic viewport-collision avoidance for anchor-positioned
popovers even without any explicit `position-try-fallbacks` authored —
the panel flips to open *above* the trigger on its own when there isn't
room below. Found while debugging what looked like a positioning bug in
a short test viewport; re-tested in a taller one and confirmed it's
real, beneficial default behavior, not a bug to work around.

**Two real timing bugs found and fixed while building this**, both from
the same root cause — Lit's update cycle and the native `toggle` event
are both asynchronous, but this primitive's own public methods need to
work correctly when called synchronously right after construction:

1. `willUpdate()` (where the native `popover` attribute was originally
   being set) hadn't necessarily run yet by the time a caller invoked
   `show()` right after creating/connecting the element — `showPopover()`
   throws if the attribute isn't already in place. Fixed by also setting
   it synchronously in `connectedCallback()`.
2. `.open` was only being updated by listening for the native `toggle`
   event — but that event is dispatched as a separate queued task, so
   reading `.open` immediately after calling `show()`/`hide()` returned
   the stale value. Fixed by setting `.open` directly inside `show()` and
   `hide()` themselves; the `toggle` listener still matters, but only for
   changes this component didn't initiate (light-dismiss, Escape, another
   exclusive popover taking over).

Both were caught by the component's own test suite (which exercises
`show()`/`hide()`/`toggle()` synchronously, matching how a real consumer
uses them) before ever reaching `<cdz-select>`.

### `<cdz-select>` rebuilt on `<cdz-popover>` — the WAI-ARIA APG "Select-Only Combobox" pattern

Replaces the native-`<select>`-based version from ADR-0009 outright, not
alongside it. Trigger is a real `<button role="combobox">`
(`aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`); the panel
is `role="listbox"` with `role="option"` children. Real DOM focus never
leaves the trigger — the "active" (highlighted) option while the panel is
open is tracked with `aria-activedescendant` instead, which is exactly
why `cdz-popover` not stealing focus on open (verified above) was a hard
requirement, not a nice-to-have.

Two deliberate simplifications versus what native `<select>` actually
does, called out explicitly rather than silently shipped as if they were
full parity:

- **Type-ahead matches one character at a time**, not native `<select>`'s
  buffered multi-character search (typing "ar" quickly to jump to
  "Argentina" specifically, as opposed to jumping to the next option
  starting with "a" then the next starting with "r"). A full buffered
  implementation needs a reset timer and more state for a real-world gain
  that's marginal for typical option-list lengths.
- **Arrow-key navigation only highlights** an option (`aria-activedescendant`
  moves); the value only changes on explicit commit (Enter, Space, or a
  click) — unlike native `<select>`, which live-previews the value on
  every arrow press while open and reverts it on Escape. Committing only
  on explicit action is simpler to implement correctly and is a
  legitimate, common combobox behavior in its own right, not just a
  shortcut.

**A real trade-off worth naming directly:** dropping the native `<select>`
also drops its Constraint Validation API participation (native
required/invalid handling, form submission blocking). This isn't a new
regression this ADR introduces — every form atom in this project already
has this exact gap, deferred since ADR-0003's action item 5 pending a
real `ElementInternals` decision. This ADR doesn't change that calculus;
it just means `<cdz-select>` was never relying on it working end-to-end
in the first place.

### Tokens: one genuinely new concept (elevation), one reused pattern extended

- `global/shadow.tokens.json` + `semantic/elevation.tokens.json` (new,
  not forked per mode — see Consequences) — the first use of the DTCG
  `$type: "shadow"` token in this project, needed because a floating
  panel needs visual separation from the page that none of the previous,
  inline form-field atoms ever required.
- `component/popover.tokens.json` otherwise reuses existing semantic
  roles (`color.form.background/border.default`) rather than inventing
  panel-specific color tokens — same "component tier references semantic,
  doesn't duplicate it" discipline as every prior atom.
- `color.surface.hover` — a new semantic role (forked light/dark, same
  raw values as the existing `neutral.100`/`neutral.800` disabled-state
  ramp, but named for its own meaning rather than reusing "disabled" by
  coincidence of matching hex values) for the option-hover/active
  highlight in `cdz-select`'s listbox.
- `spacing.64` (16rem) — the global spacing scale was `2`/`3`/`4` before
  this; a scrollable option list's `max-height` is a genuinely new need
  none of the previous atoms had.

### Gallery: two more "public API, but no generic control fits" cases

Same pattern ADR-0009 established for array-typed props
(`isArrayTyped`), extended twice:

1. `cdz-select`'s new internal `_open`/`_activeIndex` state needed to
   *not* show up as gallery controls or public attributes at all. Found
   a real gap while testing: this project's `state: true` (non-decorator
   `static properties` syntax) isn't recognized by the installed
   `@custom-elements-manifest/analyzer`'s Lit plugin — verified directly
   in its source (`isAlsoAttribute()` only checks for a literal
   `attribute: false`, with no special case for `state`). Fixed by being
   explicit (`{ state: true, attribute: false }`) and marking the
   `declare` fields TS-`private`, which the analyzer's generic
   class-member handling does pick up correctly.
2. `cdz-popover`'s `anchor` property is genuine public API (a consumer
   component sets it programmatically) — unlike the state fields above,
   marking it `private` would be factually wrong. But a raw element
   reference has no meaningful generic control either. Added
   `isElementRefTyped()` alongside the existing `isArrayTyped()` check:
   excluded from control generation, still real public API, exactly
   mirroring how `options` is handled.

## Consequences

- **Easier:** `<cdz-popover>` is available now for any future
  menu/combobox molecule — the anchor-positioning and light-dismiss work
  is solved once, not per-component.
- **To revisit:** the non-anchor-positioning fallback path computes
  position once at `show()` time and doesn't track scroll or resize
  afterward. Acceptable for a Chromium-first target today; would need
  scroll/resize listeners if broader non-Chromium support becomes a real
  requirement.
- **To revisit:** `color.elevation.raised`/`shadow.raised` intentionally
  isn't forked per light/dark mode (unlike every color role) — a fixed
  low-alpha shadow reads fine in both, and the panel's *border* (already
  correctly forked, reusing `color.form.border.default`) is what actually
  carries the accessible boundary signal; the shadow is decorative depth
  only. Worth a real contrast-style pass if a future component needs a
  mode-sensitive shadow specifically.
- **To revisit:** a bare `<cdz-popover>` previewed standalone in
  `@kdenza/gallery` has no real anchor to position against, so its
  gallery entry is illustrative only (open/close and content, not real
  placement) — its actual intended usage is demonstrated through
  `<cdz-select>`, not on its own.
- **Easier, going forward:** the two "public API, no generic control
  fits" gallery cases this ADR fixed follow one now-established pattern
  (`isArrayTyped`, `isElementRefTyped`) — the next prop shape that
  doesn't fit is one more function in the same shape, not a rethink of
  the gallery's control system.

## Action Items

1. [x] Designed `<cdz-popover>`'s API and ARIA-agnostic boundary before
   writing any code; verified the key platform behaviors (light-dismiss,
   focus retention, cross-shadow-root anchor wiring, feature-detection)
   directly in-browser first.
2. [x] Tokens: `global/shadow.tokens.json`, `semantic/elevation.tokens.json`,
   `component/popover.tokens.json`, `color.surface.hover` (light+dark),
   `spacing.64`.
3. [x] Implemented `<cdz-popover>` in Lit; found and fixed the two
   synchronous-timing bugs above via its own test suite (8 tests).
4. [x] Rebuilt `<cdz-select>` on `<cdz-popover>` with the Select-Only
   Combobox pattern: trigger button, listbox panel, keyboard (arrows,
   Home/End, type-ahead, Enter/Space, Escape free), never moving real
   focus off the trigger.
5. [x] Dogfooded on the design-system page (all four existing states:
   default+placeholder, helper text, required+error, disabled) and in
   `@kdenza/gallery`, including the two gallery control-filtering fixes.
6. [x] Full rebuild + test verification: 74/74 passing; manually verified
   in-browser in both color schemes, keyboard interaction, disabled
   inertness, and axe accessibility (zero violations, collapsed/expanded/
   error states) via both the test suite and the gallery's live a11y
   panel.
