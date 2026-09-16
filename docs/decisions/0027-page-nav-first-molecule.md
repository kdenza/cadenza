# ADR-0027: `<cdz-page-nav>` — the first molecule, and the same bug twice

**Status:** Accepted
**Date:** 2026-09-05
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

The design system page had grown to **9,917px — 35 screens of scroll**
across 18 sections, with no way to jump between them. Worse, **none of the
headings had an `id`**, so there was nothing to link to even by hand.

This is the first component past the atom line, which makes the category
question worth answering explicitly rather than by feel.

## Decision

### It is a molecule, and here is the test that settles it

Every previous component is an atom: one control, one job, no internal
coordination. This one composes `cdz-button` and `cdz-icon`, renders a
list of links, and owns a piece of state — *which section is current* —
that none of its parts could own alone.

That last part is the useful test. A component that only arranges other
components is a layout. A component that has to **know something none of
its children know** is a molecule.

### The Disclosure pattern, not a drawer, and not a menu

**Not `role="menu"`.** That role is for application menus with roving
focus and typeahead. Applying it to a list of links makes screen readers
announce a menu that then does not behave like one — worse than no role at
all. This is a `nav` landmark with a list of links, which is what it
actually is.

**Not an off-canvas drawer.** A drawer that overlays content needs a focus
trap, `inert` on the rest of the page, scroll locking, and focus
restoration on close. It is the pattern most often implemented wrongly,
and this project has no focus-trap utility to build on. More to the point:
a reader is not in an application, they are reading a page. A disclosure
cannot trap anyone, because there is nothing to trap them in.

Below the breakpoint a button toggles the list with `aria-expanded` +
`aria-controls`. Above it the list is permanent and **the button is
removed from the layout entirely** — not visually hidden — so it leaves
the tab order too. A control that toggles something already visible is a
control with nothing to do.

One consequence worth stating: above the breakpoint `aria-expanded` may
read `false` while the list is visible. That is not a lie to anyone,
because the button is not perceivable there at all.

### `aria-current="location"`, not `"page"`

These links point at sections of the document being read, not at other
pages. `"page"` would claim the reader is somewhere they are not.

Current state is signalled **three ways** — colour, weight, and a
start-edge marker — because colour alone fails WCAG 1.4.1 and weight alone
is easy to miss in a dense list. The marker sits on a transparent border
that is always present, so an item does not shift when it becomes current.

### It does not use `cdz-link`

`cdz-link` is built for inline prose: it inherits typography and carries a
permanent underline (ADR-0015), both correct there and wrong here.
Eighteen underlines stacked in a column is noise rather than affordance —
a list of links already reads as links from its layout.

Forcing one atom to serve both jobs would have meant weakening the rule
that makes it good at the first. Two different jobs, two different
implementations.

### The section list is derived by the page, not by the component

A hand-written list of 18 sections is a second source of truth that drifts
the moment one is renamed — the kind of failure the component cannot
detect and the reader can.

So the list is derived from the page's own `h2[id]` elements. But the
derivation lives in the **page**, not in the component: `cdz-page-nav`
renders whatever sections it is handed, which keeps it testable without a
document around it. Deciding *which* sections belong is the page's job.

The scroll spy does reach outside, and resolves ids through
`getRootNode()` rather than `document` — so it keeps working inside
another shadow root, where `document.getElementById` would silently find
nothing. The same tree-scoping ADR-0020 ran into.

Smooth scrolling belongs to the page too (`scroll-behavior` on `html`),
disabled under `prefers-reduced-motion`: a long automatic scroll is
exactly the motion that preference exists to avoid.

## The same bug, twice, five commits apart

ADR-0025 documented that `:host { display: ... }` silently disables the
`hidden` attribute, because author styles beat the UA stylesheet. That was
fixed across all 18 atoms, covered by a test, and written up.

**This component reintroduced it immediately.** The list has
`ul { display: flex }`, so `?hidden` did nothing: the disclosure button
reported `aria-expanded="false"` while the list stayed on screen.

The lesson is that ADR-0025 was stated too narrowly. It is not a `:host`
rule — it is a rule about **any element you give a `display` to**:

> Giving an element a display rule overrides the browser's
> `[hidden] { display: none }`. Wherever you set display, you owe a
> matching `[hidden]` rule.

Knowing the general principle and having applied it once in a specific
form did not prevent repeating it in a slightly different shape. The fix
is not more care, it is the test: the suite now asserts the rule exists,
so the next component that forgets it fails rather than ships.

### That test needed the CSSOM

Asserting computed `display` directly does not work here, because above
the breakpoint a deliberate override keeps the list visible — and the test
runner's window is wider than the breakpoint. The behaviour is conditional
on an environment the test cannot set.

So the rules are read from the shadow root's adopted stylesheets: the
top-level `ul[hidden] { display: none }` and its counterpart inside the
media query. Same technique ADR-0018 used for `prefers-reduced-motion`,
and for the same reason.

## Amendment (2026-09-16): where the list lives above the breakpoint

This ADR answered "does the list fit on a narrow screen" and never
answered "where does it go on a wide one". Above the breakpoint the list
was simply left in the normal flow — so on the design system page, 22
items pushed the first component below the fold, and finding another
component meant scrolling all the way back up to a nav that had long since
gone off screen.

The list was not too long. It was in the wrong place.

**The fix is layout, not the component.** Above the same 48rem breakpoint
the page puts the nav in its own `position: sticky` column. The component
is unchanged: same nav landmark, same links, same `aria-current`, same
disclosure below the breakpoint. Only `main`'s grid and the nav's position
moved, both in the site's stylesheet.

That this required no component change is the evidence that the original
split was right. This ADR had already called it "a page-level question" —
whether *this* page has room for persistent navigation — and kept
positioning out of the component precisely so a page without that room
would still work.

Two alternatives were considered and rejected, for the reasons already
recorded above rather than new ones:

- **A dropdown menu** does not solve the stated problem. The complaint was
  having to scroll back to reach the nav; a closed menu has to be reached
  too. It would also hide the scroll spy, whose whole value is being
  visible — "you are here" announced inside a closed menu tells nobody
  anything.
- **A drawer** still needs the focus trap, `inert`, scroll locking and
  focus restoration this ADR rejected it for, and still costs a click per
  use.

Sticky costs neither: the nav is simply always there.

Two details the layout had to get right:

- The sidebar breakpoint is the component's own 48rem, not a new number,
  so there is one transition rather than two — below it a button toggles
  the list, above it the list lives in the margin. A separate, wider
  breakpoint would have created a middle range where the list is permanent
  *and* in the flow, which is the bug.
- The list is taller than most viewports, so the column gets
  `max-height: calc(100vh - 2rem)` and scrolls internally. Without it the
  nav grows past the bottom of the screen and its last items become
  unreachable while stuck.

A third detail, and the one that actually shipped broken first: the nav
was given `grid-row: 1 / -1` to span the content column's rows. **A
negative grid line refers to the end of the *explicit* grid**, and only
columns were declared here. With no explicit rows the value silently
collapses to row 1 — whose height then becomes the nav's own 758px,
opening a 730px hole above the first component. The fix is a span larger
than the page will need (`1 / span 40`); if a page ever exceeds it the nav
spans fewer rows, which is harmless because it is sticky and height-capped
anyway.

It shipped because the first verification was read carelessly: the first
section measured 47px from the top, which looked correct, but the page was
scrolled at the time and nobody checked `scrollY`. A position is only
meaningful next to the scroll offset it was taken at. Same family as
ADR-0019's table — the measurement was real, the reading of it was not.

Verified by measurement rather than by eye: at 1280px the nav's
`getBoundingClientRect().top` stays at 16px at every scroll position,
and at 375px the layout returns to a single column with the disclosure
button and a genuinely hidden list.

## Consequences

- **Easier:** 35 screens of documentation became navigable, and the
  sections are deep-linkable, which they were not before.
- **The atom line held.** Building the first molecule needed exactly one
  new icon and no changes to any existing atom. That is the strongest
  evidence so far that the atoms were scoped correctly.
- **To revisit:** the breakpoint is a media query, not a container query.
  A container query would let the component respond to its own width,
  which sounds better but is the wrong signal: a 200px sidebar on a wide
  screen should still show the list. The question is "does this page have
  room for persistent navigation", which is a page-level question.
  *(The amendment above acts on exactly this: the page, not the component,
  decides there is room and puts the nav in a sticky column.)*
- **To revisit:** the scroll spy uses a `rootMargin` tuned by eye
  (`0px 0px -70% 0px`) so "current" means the section being read rather
  than any section on screen. It has not been tested against very short
  sections, where several could qualify at once.

## Action Items

1. [x] Drew the `menu` icon on the grid (stroked extent 3→21 × 5→19,
   within the live area) and added `id` to all 18 headings.
2. [x] `component/page-nav.tokens.json` — reuses existing semantic roles;
   only the marker width and the breakpoint are new literals.
3. [x] `<cdz-page-nav>` (Lit): nav landmark with a required name,
   disclosure below the breakpoint, `aria-current="location"`, scroll spy
   resolved through `getRootNode()`.
4. [x] Tests: landmark naming, one link per section, `location` over
   `page`, disclosure wiring, the list genuinely hiding (via the CSSOM),
   toggling, icon swap, collapse-on-follow, no toggle when empty, the
   missing-name warning, and accessibility in three states — 265/265.
5. [x] Dogfooded on the design system page, with sections derived from
   the page's own headings.
