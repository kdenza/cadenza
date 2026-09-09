# ADR-0030: `<cdz-avatar-stack>` — the other half of ADR-0029

**Status:** Accepted
**Date:** 2026-09-08
**Deciders:** Cadenza design system owner (UX Engineer)
**Related:** [ADR-0022](0022-avatar-component.md), [ADR-0029](0029-radio-group-composition-that-breaks-semantics.md), [ADR-0017](0017-badge-and-status-palette.md)

## Context

ADR-0029 found that `<cdz-radio-group>` must **not** compose `<cdz-radio>`:
native radio grouping does not cross shadow roots, so nesting the atom
would have destroyed the guarantee the atom was chosen for.

Stated that baldly, it is easy to take the wrong lesson from it — that
molecules in this system do not compose atoms. That would be a bad rule,
and this component is the case that shows why.

## Decision

### The test is not "does it compose", it is "who provides the guarantee"

An avatar's correctness is its own accessible name. A name is a property of
the element; it survives being nested anywhere. No part of it depends on
the browser being able to see sibling elements in the same tree.

So this molecule composes the atom freely: it renders real `<cdz-avatar>`
elements and forwards `size`, `src` and `fallback` to them.

> **The rule, stated properly:** composition is safe when the atom's
> guarantee travels with the element. It is unsafe when the guarantee comes
> from the platform relating that element to its siblings, because a shadow
> root is exactly what breaks that relation.

Radio grouping is a relation between siblings. An accessible name is not.
That single distinction decides both components, in opposite directions.

### A real `<ul>` of real `<li>`

A stack of people is a list, and a list gives a screen reader the count and
per-item navigation for nothing. `<ul>` may only directly contain `<li>`,
so the avatars are **rendered** rather than slotted: a bare `<slot>` inside
a `<ul>` would put generic wrappers between the list and its items.

This is also why "compose the atom" did not have to mean "slot the atom".
Rendering `<cdz-avatar>` in the shadow root composes it just as truly, and
keeps the list structure honest. It also matches how every other collection
in this system takes its data — `cdz-select`, `cdz-radio-group` and
`cdz-page-nav` all take an array property.

The list is named with `aria-label`, so it is not announced as an anonymous
"list, 5 items".

### People past `max` are not rendered, not hidden

Dropping them keeps the accessible experience at parity with the visual
one. A sighted user cannot read those names either; leaving them in the
accessibility tree would expose exactly what the visual design decided not
to show. `+N` is a count, and it is a plain `<span>`, not an avatar —
giving it `<cdz-avatar>`'s semantics would announce a number as somebody's
picture.

### Stacking order: reversed, after looking at it

The conventional-looking order puts earlier avatars on top. Built that way,
the stack was wrong in a way that only showed on screen:

```
AL  |R  |D  |M  |S      ← every name after the first lost its FIRST letter
```

Each avatar after the first has its **left** edge covered by its
neighbour, and since ADR-0022 made initials the default fallback, that eats
the letter a reader starts on. Reversing it costs the trailing letter
instead:

```
Al  Bl  Cl  Dl  ES      ← every avatar keeps the letter you start reading on
```

The first CSS comment written here asserted the original order "reads
left-to-right the way the names do". It did the exact opposite. No test
would have caught it — both orders are internally consistent, the a11y tree
is identical, and axe passes either way. It took looking at the rendered
page.

That is the same lesson as ADR-0024's deploy and ADR-0025's `hidden` bug,
in a third costume: **some defects are only visible in a browser**, and a
green suite is not a substitute for opening the thing.

### Zero new global tokens, again

Overlap is 1/3 of the avatar, which lands exactly on the existing
`spacing.2/3/4` scale, so the sparse scale (0.5 / 0.75 / 1rem) stayed
sparse. The `+N` chip reuses `color.status.neutral.*` from ADR-0017 rather
than inventing a pair — that palette was contrast-verified across all 20
combinations, so the chip inherits the guarantee instead of needing its
own.

## A dev-server trap worth recording

Mid-verification the page rendered with no styles and **no custom elements
defined at all**. The cause was not the code: `npm run build` starts with
`rm -rf dist`, and the running Vite dev server cached a 404 for
`dist/styles/tokens.css`. Since `main.ts` imports that CSS on its first
line, the failed import took the whole module down — including every
`customElements.define`.

The file was on disk the whole time. Checking that, rather than trusting
the screen, is what separated "stale server" from "I broke something".
Restarting the dev server fixed it. Worth knowing, because the symptom
(nothing works, no JS errors) looks far more alarming than the cause.

## Consequences

- **Easier:** the roadmap's last identified molecule is done, and ADR-0029
  now reads as a test to apply rather than a prohibition.
- **The `hidden` coverage guard from ADR-0029 paid for itself immediately.**
  It blocked this component's first test run because `cdz-avatar-stack` was
  not in the list — before a browser started, without anyone remembering.
- **To revisit:** with heavy overlap, only the leading letter or two of
  each name is legible, so the stack visually conveys *how many* more
  reliably than *who*. The accessible list conveys both. That is an
  acceptable asymmetry for a stack but not for a primary identifier — the
  same warning ADR-0022 gave about avatars used as the only label.
- **To revisit:** no interaction. The avatars are not links or buttons, and
  the `+N` does not expand. That is deliberate for now: a stack that
  reveals its overflow is a popover problem, and `cdz-popover` already
  exists to solve it if it is ever wanted.

## Action Items

1. [x] `component/avatar-stack.tokens.json` — overlap on the existing
   spacing scale, chip on ADR-0017's verified neutral pair.
2. [x] `<cdz-avatar-stack>`: named `<ul>`/`<li>`, `max` with a `+N` count,
   three sizes forwarded to the atoms.
3. [x] 13 tests, including the mirror of ADR-0029's contrast test — that
   nesting the atom does **not** cost it its accessible name — and axe in
   three configurations. 297/297.
4. [x] Reversed the stacking order after seeing initials clipped on the
   leading letter; the test now asserts ascending, with the reason.
5. [x] Dogfooded on the design system page in five configurations.
