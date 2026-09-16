# ADR-0031: Setup that runs once, teardown that runs every time

**Status:** Accepted
**Date:** 2026-09-16
**Deciders:** Cadenza design system owner (UX Engineer)
**Related:** [ADR-0010](0010-popover-primitive-and-select-rebuild.md), [ADR-0020](0020-tooltip-component.md), [ADR-0025](0025-hidden-attribute-and-host-display.md), [ADR-0027](0027-page-nav-first-molecule.md), [ADR-0028](0028-tests-that-depend-on-the-rendering-pipeline.md), [ADR-0029](0029-radio-group-composition-that-breaks-semantics.md)

## Context

A per-component audit turned up the same defect in three components at
once:

- `<cdz-select>` added its `<cdz-popover>` `toggle` listener in
  `firstUpdated()` and removed it in `disconnectedCallback()`.
- `<cdz-page-nav>` built its `IntersectionObserver` from `updated()` —
  only when `sections` or `spy` changed — and disconnected it in
  `disconnectedCallback()`.
- `<cdz-tooltip>` resolved its trigger from the slot in `firstUpdated()`.

The shared cause looked obvious. **A custom element's setup hooks and its
teardown hooks do not run the same number of times.** `firstUpdated()`
fires once per element, ever. `disconnectedCallback()` fires on every
unmount. Acquire in the first and release in the second, and the component
works exactly until someone moves it — a framework re-keying a list, a
mount into a dialog, any reparent — and is then quietly inert for the rest
of its life.

Nothing throws. The element still renders. `<cdz-select>` went on
reporting `aria-expanded="true"` over a listbox the browser had already
closed; `<cdz-page-nav>` lost its scroll spy and simply stopped marking
the current section.

All three had been through review with passing suites. The suites missed
it for one reason: **every test mounts an element and leaves it there,**
which is the one history no real page has. Nothing in 300 tests had ever
removed a component and put it back.

The correct shape was already in the repository, undocumented.
`<cdz-popover>` adds its native `toggle` listener in `connectedCallback()`
and removes it in `disconnectedCallback()`, so it survives a reparent. But
ADR-0010 discusses that hook only for the timing of the `popover`
attribute — the symmetry is a by-product of where the listener happened to
go, not a stated decision. Which is exactly why it did not spread: an
undocumented right answer is not a rule, and the three components written
after it each reached for a different hook.

## Decision

### Re-establish in `connectedCallback`, and resync

`<cdz-select>` and `<cdz-page-nav>` now re-arm on reconnect, guarded by
`hasUpdated` so the first connect (which precedes first render) stays a
no-op. `<cdz-select>` also resyncs: removing a showing popover from the
document hides it, so the previous open state is stale by definition.

That resync exposed a second-order problem, and it is one ADR-0010
already half-found. That ADR recorded `.open` going stale when read
straight after `show()`/`hide()`, because the native `toggle` event
arrives as a separate queued task, and fixed it by setting `.open`
directly inside those methods — noting that the listener still mattered
for changes the component did not initiate.

The same property goes stale a second way, which that fix does not reach:
the browser hides a popover on removal from the document **without firing
anything the element can hear**. So `.open` outlives the state it names,
and no listener can repair it. `_syncOpenState()` now reads
`:popover-open`, which is already what `cdz-popover`'s own
`show()`/`hide()`/`toggle()` test.

> A property that mirrors browser state is only as good as the
> notifications that maintain it. Where the platform offers the state
> directly, read the platform.

### Three rules, because it was never one bug

The guard was written to generalise "setup in `firstUpdated`, teardown in
`disconnectedCallback`, no re-setup". Writing it is what showed that
framing was wrong.

`<cdz-tooltip>` **never released its trigger listeners on unmount at
all.** It has no connect/disconnect asymmetry. Its bug was that a trigger
arriving after first render — a conditional branch, an awaited fetch, a
host mounted before its children — was never picked up, and the component
blamed the consumer's markup in the console on the way past. It now wires
`@slotchange`, releasing a replaced trigger before adopting the new one.

So `scripts/check-lifecycle-symmetry.mjs` carries three rules:

1. A `disconnectedCallback` that **releases** something needs a
   `connectedCallback` that does more than call `super`.
2. Every `removeEventListener('x')` on unmount needs a matching
   `addEventListener('x')` in `connectedCallback`.
3. A component that resolves slotted content imperatively
   (`assignedElements`/`assignedNodes`) must wire `@slotchange`.

Rules 1 and 2 catch `cdz-select` and `cdz-page-nav`. Rule 3 catches
`cdz-tooltip` — and rules 1 and 2 would have passed it clean.

> **The transferable part.** Naming a pattern across several instances is
> a *hypothesis*, and writing the generalisation is where you find out
> whether it holds. Had the guard been written to the framing that
> produced the fixes, it would have covered two of the three and printed
> a tick. That is worse than no guard, because a guard certifies.

This is ADR-0028's argument arriving from the other side. There, a hand
search found two instances of a shape when there were four. Here, the
hand fix was complete and the *description* of it was not.

### Timers are deliberately not a release

`clearTimeout` and `clearInterval` are excluded from what counts as
releasing something. A timer scheduled by a hover or a keystroke **should**
die on unmount and must not be re-armed on reconnect, so demanding a
counterpart for those would be demanding a bug. `<cdz-tooltip>` clears two
in `disconnectedCallback` and is correct to.

### What it does not catch, stated in the script

Rule 1 is a coarse net: it asks that a `connectedCallback` exist and do
something, not that it do the right thing. Nothing here catches something
acquired in `firstUpdated` and released nowhere. A test is still the only
thing that proves behaviour; this proves the shape.

## A test that asserted against a state no user can reach

`<cdz-select>`'s "Escape closes without changing the value" test
constructed a bare `ToggleEvent` and dispatched it at the popover, while
the popover stayed genuinely open. The component believed the event, so
the test passed — measuring a fiction. It broke the moment
`_syncOpenState()` started reading `:popover-open`, which is how it was
found.

It now calls `hidePopover()`, which changes the state *and* fires the same
native event. The corrected version passes against both the old and the
new component, so it is a tightening rather than a compensating edit.

Same family as ADR-0029's finding that a synthetic `KeyboardEvent` does
not drive native radio behaviour. The shape to watch for: **a test that
synthesises the notification of a change instead of causing the change.**

## Consequences

- **Fixed:** three real defects, each invisible until a component moved.
- **Five new tests, each verified to fail against the previous sources.**
  A test that passes before and after proves nothing about either.
- **The guard was verified the same way** — run against the three pre-fix
  sources it reports all three, each by its intended rule, and exits
  non-zero. Probed for false positives too: a `disconnectedCallback` that
  only clears timers stays silent, and a commented-out `addEventListener`
  does not satisfy rule 2. A guard that has only ever passed has not been
  tested (ADR-0028).
- **`pretest` is now three checks**, all in Node, all before a browser
  starts: fixtures (ADR-0028), `hidden` coverage (ADR-0029),
  lifecycle symmetry.
- **To revisit:** the comment stripper in the guard does not recognise
  regex literals, so a regex containing an escaped slash would desync it.
  There are none in `src/` today. If that changes it needs a real
  tokeniser rather than a quiet wrong answer.
- **~~To revisit~~ — confirmed and fixed the same day, see
  [ADR-0025's amendment](0025-hidden-attribute-and-host-display.md):**
  `check-hidden-coverage.mjs` exempted `cdz-popover` on the grounds that
  its visibility is governed by the popover API rather than a `display` on
  `:host`. It was wrong: an open `cdz-popover` carrying `hidden` rendered
  at 62px, while a plain `div[popover][hidden]` stays `display: none`
  through `showPopover()`. The one component exempted from the ADR-0025
  check was the one carrying the hole it exists to find. Removing the
  exemption was not sufficient either — the systemic test cannot fail for
  a popover, because a closed one is `display: none` regardless.
- **To revisit:** `cdz-button`'s icon-centring test asserts an offset
  `lessThan(0.5)` and currently measures exactly `0.5` under a different
  Chromium build than the project's. A sub-pixel assertion with zero slack
  at the boundary is a measurement waiting to flip, which is ADR-0019's
  table again.

## Action Items

1. [x] `cdz-select`: re-arm and resync in `connectedCallback`;
   `_syncOpenState()` reads `:popover-open` rather than a mirrored
   property.
2. [x] `cdz-page-nav`: rebuild the observer on reconnect, and clear the
   dead instance rather than merely disconnecting it.
3. [x] `cdz-tooltip`: wire `@slotchange`, release a replaced trigger
   (listeners, and `aria-describedby` only while that value is still
   ours), warn once per gap rather than once per slotchange.
4. [x] `scripts/check-lifecycle-symmetry.mjs`, wired as `pretest`,
   verified against the pre-fix sources and probed for false positives.
5. [x] Corrected the select dismissal test to cause the state change
   instead of announcing it.
