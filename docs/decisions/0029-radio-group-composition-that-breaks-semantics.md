# ADR-0029: `<cdz-radio-group>` — when composing the atoms is the wrong answer

**Status:** Accepted
**Date:** 2026-09-08
**Deciders:** Cadenza design system owner (UX Engineer)
**Related:** [ADR-0007](0007-radio-component.md), [ADR-0025](0025-hidden-attribute-and-host-display.md), [ADR-0027](0027-page-nav-first-molecule.md), [ADR-0028](0028-tests-that-depend-on-the-rendering-pipeline.md)

## Context

ADR-0007 built `<cdz-radio>` on a native `<input type="radio">` and gave
the reason plainly: native brings keyboard handling, form participation
and correct AT semantics for free, and a hand-rolled `role="radio"` would
have to reimplement all of it and could get it subtly wrong.

It then documented the limitation that comes with that choice: native
radio grouping does not cross shadow root boundaries. Two `<cdz-radio>`
sharing a `name` are two groups of one. ADR-0007 deferred the fix to "a
future `cdz-radio-group` molecule" and left a test locking in the broken
behaviour so nobody could silently pretend otherwise.

This is that molecule. The obvious shape for it — slot `<cdz-radio>`
children and coordinate them — is the one this ADR rejects.

## What was measured first

Before designing anything, the deployed page's six real `<cdz-radio>`
elements were inspected:

| Measured | Result |
|---|---|
| Inputs per shadow root | 1 — every input alone in its own tree |
| Radios sharing a name in one root | 1 — so, six groups of one |
| `tabIndex` on each input | `0` on all six |

The third row is the one that changed the design. A radio group is
supposed to be **one** tab stop: Tab enters it, arrows move within it, Tab
leaves. Six standalone atoms are six tab stops. On a form with four
options that is four Tab presses to cross one question.

`document.hasFocus()` was `false` in that pane, so the actual Tab sequence
was deliberately **not** measured there — that would have been the invalid
kind of measurement ADR-0019 and ADR-0025 keep warning about. `tabIndex`
is a property read and holds regardless of focus.

## Decision

### The group renders its own native radios; it does not compose the atom

All the inputs live in the group's single shadow root, sharing one name.
They are in one tree, so the browser groups them for real, and these come
back for free:

- mutual exclusion
- arrow-key navigation, with wrapping
- roving tabindex — one tab stop for the whole group
- set position, so AT can say "2 of 3"

The alternative — slotting `<cdz-radio>` children — would require
reimplementing all four by hand, plus reaching into each child's shadow
root to manage its `tabindex`. That is precisely the work ADR-0007 chose a
native radio to avoid. **Composing the atoms would break the semantics the
atom was chosen for.**

This is worth stating as a general finding, because it contradicts the
default instinct of a design system:

> Composition is not free. When a component's correctness comes from the
> platform, nesting it inside another shadow root can cost exactly the
> guarantee you were composing it for.

It is also the second time the shadow boundary has decided an architecture
here: ADR-0020 found that name references (`aria-describedby`,
`anchor-name`) are tree-scoped, which is why the tooltip builds its nodes
in the light DOM.

Note what this does *not* mean. The atom is not wrong and is not
deprecated: `<cdz-radio>` remains correct for a single standalone choice.
It is simply not a building block of this molecule.

### `<fieldset>` + `<legend>`, not `role="radiogroup"`

`radiogroup` is the ARIA pattern for hand-built `role="radio"` widgets.
These are native radios, and fieldset/legend is the grouping browsers and
screen readers already implement for them. Reaching for ARIA here would
re-describe in ARIA what the HTML already says — the failure mode the
first rule of ARIA warns about. The UA's default fieldset border and
padding are reset, which is the only reason the element is usually
avoided.

### A name is always present, generated if not supplied

Radios with no `name` do not group at all. An empty `name` would have
produced a component that renders perfectly and silently fails to be a
group — so the group falls back to a generated name.

It does not need to be unique page-wide: grouping is scoped to a tree, and
each group has its own shadow root. The same boundary that breaks the atom
here works in our favour.

### `required` lives here, as ADR-0007 said it would

"Pick one of these" is a property of the group, not of any one option. The
test asserts the atom still has no `required` in its observed attributes,
so this stays true in both directions.

## The keyboard claim is verified, not asserted

`@web/test-runner-commands` was already in `node_modules` as a transitive
dependency and had never been used. It is now an explicit devDependency —
relying on a transitive one would break on a clean install, which is how
ADR-0028's CI failure started.

It matters because `sendKeys` drives a **trusted** event through CDP. A
synthetic `KeyboardEvent` does not trigger native radio behaviour at all,
so a test built on one would assert against a widget that never moved —
green, and measuring nothing. That is a new row for ADR-0019's table.

The suite therefore presses a real ArrowDown and asserts the selection
moved. It also contains the mirror test: two `<cdz-radio>` atoms sharing a
name, both checked at once, proving the limitation this component exists
to solve is still real.

## What writing this exposed

The systemic `hidden` test from ADR-0025 claimed in its own docstring that
it "walks the real custom element registry instead of a hand-written list,
so a new component is covered just by existing".

**That was false.** The list is hand-written, and the meta-test only
checked that every listed tag was registered — never the reverse. So a new
component was silently uncovered while the file read as exhaustive.

A Node guard now enforces the other direction, and on its very first run
it found two gaps: `cdz-radio-group`, being added at the time, and
**`cdz-page-nav` — uncovered for five commits, including the ones in which
it reintroduced the `hidden` bug** that ADR-0027 documented. The test
meant to stop that bug returning was not looking at the component that had
just demonstrated it.

The pattern is now three for three: ADR-0025's rule, ADR-0028's fixtures,
and this. Each time, a real rule was written down, applied by hand to the
instances someone could see, and quietly missed elsewhere. Prose describing
a guarantee is not the guarantee.

## Consequences

- **Easier:** a real, keyboard-correct single-choice group, with one tab
  stop, arrow keys and set position, all from the platform.
- **ADR-0007's deferred promise is closed**, and the design system page no
  longer has to caption a known gap as future work.
- **Harder:** the control visuals are duplicated between `radio.styles.ts`
  and `radio-group.styles.ts`. They resolve through different token
  prefixes, because every component owns its own token tier, so the CSS
  cannot simply be shared. About 40 lines. Extracting a prefix-parameterised
  fragment was considered and rejected as more indirection than the
  duplication costs.
- **Two guards now run before any browser starts** — rAF fixtures and
  hidden coverage. Both exist because a hand fix did not hold.
- **To revisit:** the group's inputs are in a shadow root, so they do not
  participate in an outer `<form>`. That is true of every form component in
  this system and is ADR-0003's still-open `ElementInternals` question, not
  a new debt introduced here.
- **To revisit:** `orientation="horizontal"` wraps with `flex-wrap` but
  does not switch to vertical at narrow widths. For two or three short
  options that is fine; a longer set would want a container query.

## Action Items

1. [x] Measured the real tab-stop cost on the deployed atoms before
   designing (six tab stops for six radios).
2. [x] `component/radio-group.tokens.json` — references the same semantic
   roles as radio; no new global token (the horizontal gap reuses
   `spacing.4` rather than growing the scale).
3. [x] `<cdz-radio-group>`: fieldset + legend, generated name fallback,
   group-level `required`, per-option `disabled`, both orientations.
4. [x] 17 tests, including a real-key ArrowDown via `sendKeys` and the
   mirror test proving two atoms still do not group — 284/284.
5. [x] `@web/test-runner-commands` promoted from transitive to declared.
6. [x] `scripts/check-hidden-coverage.mjs` as `pretest`; fixed the false
   claim in `hidden-attribute.test.ts` and covered `cdz-page-nav`, missing
   for five commits.
7. [x] Dogfooded on the design system page in three states, verified in
   light and dark.
