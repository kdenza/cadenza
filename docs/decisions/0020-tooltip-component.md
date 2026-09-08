# ADR-0020: `<cdz-tooltip>` — two things that do not cross a shadow root, for the same reason

**Status:** Accepted
**Date:** 2026-08-02
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Last component in "Feedback", and the one flagged from the start of the
roadmap to be left until the end for being the hardest to make accessible.
It arrived with `<cdz-popover>` (ADR-0010) already built, which solved
positioning and the floating layer — or so it seemed.

## Decision

### The finding that defines the architecture: a shadow root blocks two different things

The obvious structure — trigger supplied by the consumer (light DOM),
bubble rendered in the component's shadow root — **does not work**, and it
fails in two independent ways that turn out to have the same cause.

**1. The ARIA reference does not cross.** `aria-describedby` resolves ids
within a single *tree scope*. Also verified that the modern API,
`ariaDescribedByElements`, exists and is supported, but when assigned an
element living *inside* a shadow root from a trigger outside it,
**discards the reference without throwing**: the array reads back with
`length: 0`. The opposite direction (shadow → light) does work; only
inward is blocked.

**2. Visual anchoring does not cross either.** This was discovered later,
and it stings more because the CSS looked perfect: `anchor-name` on the
trigger, `position-anchor` on the bubble, same name, and still the bubble
appeared at (0,0). Isolated with a minimal probe:

| Arrangement | Does it anchor? |
|---|---|
| Trigger and bubble in the **same** shadow root (what `cdz-select` does) | Yes — bubble right under the trigger |
| Trigger in light DOM, bubble in a shadow root | **No** — bubble at (0,0) |

`anchor-name` is *tree-scoped*, exactly like ids. ADR-0010 had documented
that anchoring works "regardless of which code set it" — true, but only
while both elements share a scope, which was `cdz-select`'s case and is
not a tooltip's.

**Consequence:** both auxiliary nodes — the accessible description and the
visible bubble — are built imperatively as children in the component's
**light DOM**, sharing scope with the trigger. That is why `render()` is
nothing but a `<slot>`, and the styles reach the bubble with
`::slotted()`.

The description is hidden by clipping, never with `display: none`: an
unrendered node is not in the accessibility tree, which would defeat the
whole fix.

The text ends up duplicated across both nodes. `aria-description` (a
string, no id reference) would remove the duplication and is supported in
this browser, but its screen-reader support is younger than
`aria-describedby`'s. Left as a simplification to revisit.

### Why the popover is `manual`

`<cdz-popover>` uses `auto` by default, and `auto` popovers **dismiss each
other** — verified. A tooltip appearing while a `<cdz-select>` is open
would close the listbox: a real interaction bug, not a hypothetical one.
`manual` popovers coexist with `auto` ones in both directions, so the
tooltip uses `manual` and pays the price of handling Escape itself.

### WCAG 1.4.13 (Content on Hover or Focus)

All three conditions, deliberately:

- **Dismissible** — Escape closes without moving pointer or focus.
- **Hoverable** — leaving the trigger *schedules* the close rather than
  closing immediately, and entering the bubble cancels it. This matters
  most with screen magnification, where reading the tooltip can require
  putting the pointer on it.
- **Persistent** — nothing closes it on a timer.

Focus opens with no delay; hover waits, so sweeping the pointer across a
row of controls does not fire a tooltip for each one.

### What it is not

A tooltip cannot contain anything interactive: it is reachable neither by
Tab nor as a navigable container, so anything focusable inside would be
unreachable. `text` is a string and not a slot precisely so that is
impossible to get wrong. A floating panel with buttons or links is a
popover, and `<cdz-popover>` is already the primitive for that.

### A verification artefact that almost read as a bug

With `.focus()` from a script the tooltip would not open, and the
`focusin` listener never fired even though `activeElement` did change.
Cause: when the document does not have focus, `.focus()` moves
`activeElement` but **emits no focus events**. With a real Tab — after a
click that gives the document focus — it opens correctly.

Worth noting the unit tests could not have caught it: they dispatch
synthetic `FocusEvent`s, which bypass the real focus system. They prove
the handler works, not that the event arrives.

## Consequences

- **Easier:** it is now written down that shadow DOM blocks *name
  references* in general — ARIA ids and CSS `anchor-name` — and not just
  one of the two. Any future component relating a consumer-supplied
  element to one of its own hits the same wall.
- **To revisit:** `aria-description` as a way to remove the text
  duplication.
- **To revisit:** no tooltips on touch. There is no hover, and focus only
  arrives on tap, which also activates the control. Tooltips are
  intrinsically a pointer-and-keyboard pattern; on mobile the information
  should be visible or in an explicit popover.
- **To revisit:** the bubble lives in the light DOM, which means it is
  visible to the consumer's CSS. That is the price of anchoring working,
  but it breaks the encapsulation every other component does have.

## Action Items

1. [x] Verified the traps in-browser before designing: ARIA references
   crossing shadow roots (including `ariaDescribedByElements`' silent
   discard), and that `auto` popovers dismiss each other.
2. [x] Discovered during implementation that CSS anchoring does not cross
   the shadow root either, isolated it with a minimal probe, and
   restructured the component to build both nodes in the light DOM.
3. [x] `<cdz-tooltip>` (Lit): hidden description with `role="tooltip"`,
   `aria-hidden` and `manual` bubble, hover with delay, focus without
   delay, Escape, and a scheduled close to allow the pointer's journey.
4. [x] Tests: an id that genuinely resolves from the document, hiding by
   clipping, bubble outside the accessibility tree, `manual` popover,
   opening by focus and by hover, Escape, the three 1.4.13 criteria,
   unique ids per instance, text synchronisation, and the warning when
   there is no trigger — 202/202.
5. [x] Verified in-browser with a real Tab and real hover: it opens,
   anchors correctly under the trigger, and closes with Escape.
