# ADR-0015: `<cdz-link>` — no disabled state, two automatic obligations for new tabs, and a style this project cannot verify

**Status:** Accepted
**Date:** 2026-07-30
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Eleventh atom, and the only entry in the roadmap's "Texto y navegación"
section. A link looks like the least interesting control left — it's
almost entirely native behavior — and the decisions worth recording turn
out to be about what this component deliberately *refuses* to do.

## Decision

### Typography is inherited, not set — the first atom where that's true

Every previous atom sets its own `font-family`/`font-size`/`font-weight`,
because every previous atom is a block-level control with its own visual
identity. A link is inline content that normally sits inside a sentence,
so imposing a size would make a link inside a heading render at body
size. `link.styles.ts` therefore sets `font: inherit` and
`:host { display: inline }` (not `inline-block`, which would refuse to
wrap mid-phrase).

Verified rather than assumed: the same component dropped into a 40px
`<h1>` computed to 40px, and into an 11px `<small>` computed to 11px.

### Always underlined

`text-decoration: underline` is not configurable. WCAG 1.4.1 (Use of
Color) requires that color not be the only means of conveying
information, and body-copy links are the textbook case — a lilac word in
a lilac-free paragraph is only distinguishable by hue. The contrast
numbers are fine on their own (see below), but contrast is a different
success criterion from *using color alone*, and satisfying one doesn't
satisfy the other.

### No `disabled` — a real divergence from the form atoms

HTML has no disabled state for links, and both common workarounds are
wrong:

- `aria-disabled="true"` on an `<a href>` announces "dimmed" but leaves
  the link fully clickable and followable.
- Removing `href` to "disable" it destroys the link entirely: an `<a>`
  without `href` gets no `link` role and drops out of the tab order.

The underlying distinction is that a link is a *destination* and a
disabled control is an unavailable *action*. `<cdz-button disabled>`
already covers the second case correctly (ADR-0001's `aria-disabled`
reasoning), so this component points there instead of inventing a broken
third option. This mirrors `<cdz-range>`'s deliberate omission of
`required` (ADR-0013): recorded in the class comment so it reads as a
decision, not an oversight someone later "fixes" by copying a prop from
a neighbouring atom.

### `href` is mandatory, enforced the same way `label` is

Same reasoning as the missing-`label` check every form atom runs: an
`<a>` without `href` isn't a link, which is a hard accessibility failure
rather than a cosmetic slip. Same contract too — `console.error`, never
throw, re-checked in `willUpdate()` so clearing a valid `href` later is
caught as well.

Deliberately **not** extracted into `shared/` yet. `warnIfLabelMissing`
was only pulled out once the identical check appeared in a third
component (ADR-0009), and this is the first non-label instance of the
pattern with a different message and different semantics. Extract on the
second occurrence, not on the first — the same discipline that produced
the existing shared utility.

### `target="_blank"` carries two separate obligations, both automatic

Both are easy to forget, and forgetting either is a real defect, so
neither is left to the consumer:

1. **Security** — `rel="noopener"` is *merged into* whatever `rel` the
   consumer passed, never overwriting it (a consumer asking for
   `nofollow` keeps it and gets the security default too). Modern
   browsers already imply this behavior for `target="_blank"`, so this is
   defense-in-depth for older engines plus an auditable, explicit
   attribute. `noreferrer` is deliberately **not** added: it also strips
   the `Referer` header, which is a privacy/analytics decision belonging
   to the consumer, not a security default to impose.
2. **Accessibility** — an unannounced new tab changes context without
   warning (WCAG 3.2.5), which is disorienting for screen-reader users
   and anyone relying on the back button. A visually-hidden note plus a
   small visual icon covers both audiences (WCAG technique G201). The
   note is exposed as `newTabLabel` so it can be translated, consistent
   with `<cdz-file-input>`'s translatable `triggerText`/`placeholder`
   (ADR-0014) — the same "the application owns its copy" principle.

The hidden note uses the clip technique, not `display: none`, for the
same reason as `<cdz-file-input>`'s hidden input: it has to stay in the
accessibility tree.

### No `:visited` styling — and the reason is methodological

This is the interesting one. Browsers deliberately lie about visited
links to prevent history sniffing: only a small set of properties can be
styled via `:visited`, and `getComputedStyle` reports the **unvisited**
values regardless. Confirmed directly, on a link pointing at the current
page with a `:visited` rule setting three properties:

| Probe | Result |
|---|---|
| `:visited { color: red }` | `getComputedStyle` reported the *unvisited* blue |
| `:visited { font-weight: 900 }` | ignored entirely (not a permitted property) |
| `element.matches(':visited')` | `false` |

Every color decision in this project is signed off against measured
contrast, read back out of the browser. For `:visited`, that measurement
is impossible **by design** — the platform actively prevents it. Shipping
a visited color would mean shipping the one color in the system that
can't be verified the way all the others were.

That's a defensible reason to leave it out for now, and a much better
reason than "we didn't get to it". Recorded here so a future decision to
add it is made knowingly, with visual-only verification accepted as the
trade-off.

### Zero new color tokens

`component/link.tokens.json` reuses `color.action.primary.background.default`
(default) and `.hover`, plus `color.focus.ring`. The default color's use
as text was already verified in ADR-0014; the hover value was checked
here for the same reason ADR-0002 warned about — a color validated in one
role isn't automatically valid in another:

| Pair | Ratio | AA text (4.5:1) |
|---|---|---|
| lilac.700 on surface.50 (light, default) | 5.60:1 | pass |
| lilac.500 on surface.900 (dark, default) | 6.16:1 | pass |
| lilac.800 on surface.50 (light, hover) | 6.84:1 | pass |
| lilac.400 on surface.900 (dark, hover) | 7.43:1 | pass |

The only genuinely new values are underline geometry
(`underline.offset`, `underline.thickness`) as literal component-tier
dimensions — the same precedent as every prior atom's literal
`border-width`.

## Consequences

- **Done (2026-08-02):** the site's hand-rolled anchors were migrated to
  `<cdz-link>` and the now-dead `nav a { color: … }` rule removed from
  `global.css` — it could never have reached the real `<a>`, which lives
  inside the component's shadow root.

  The migration stopped being cosmetic once an accessibility audit
  measured what the *un*migrated links were doing. The ADR links written
  in prose as plain `<a>` inherited no colour from the site at all
  (`global.css` only ever styled `nav a`), so they fell back to the
  browser's default link blue — `#9e9eff`, Chrome's **dark-mode** link
  colour, because the OS preferred dark. On a page whose theme was forced
  light, that landed at **2.2:1** against `#faf4f6`: four real WCAG
  failures, in the very page that documents this component.

  Worth keeping as the lesson rather than just the fix: the design system
  had the right answer built and verified (permanent underline, contrast
  signed off in this ADR's own table) and it still shipped broken links,
  because the page author — me — reached for a bare `<a>` out of habit.
  Dogfooding only pays if it is actually done.
- **To revisit:** no "external domain" detection. The component treats
  `target="_blank"` as the trigger for its affordances, not
  cross-origin-ness. A link to another site that opens *in the same tab*
  gets no icon — correct per WCAG (no context change), but some design
  systems mark it anyway as a UX nicety. Left out as scope, not
  overlooked.
- **To revisit:** `:visited`, per the reasoning above.
- **To revisit:** no button-styled link variant. A link that looks like a
  button is a real need (a prominent call-to-action that navigates), but
  it's a styling variant question that touches `<cdz-button>`'s tokens
  too, and is better decided once rather than half-solved from this side.

## Action Items

1. [x] Verified the two non-obvious platform behaviors in-browser before
   designing: the `:visited` privacy restrictions (including
   `getComputedStyle` reporting unvisited values), and `relList` support
   for `noopener`/`noreferrer`.
2. [x] `component/link.tokens.json` — zero new color roles; hover
   re-verified as text against both page backgrounds.
3. [x] `<cdz-link>` (Lit): native `<a>`, inherited typography, permanent
   underline, mandatory `href` with a loud warning, merged `noopener`,
   translatable new-tab note plus icon, `download` supporting both the
   valueless and renamed forms, no `disabled`, no `:visited`.
4. [x] Tests: anchor/href rendering, accessibility (plain and new-tab),
   `rel` merging (added / merged with `nofollow` / not duplicated / absent
   for same-tab), the new-tab note being hidden-but-exposed and the icon
   being `aria-hidden`, note translation, download in both forms,
   permanent underline, and the `href` warnings — 137/137 across all
   components.
5. [x] Showcased on the design-system page (inline in a sentence, new-tab
   external, download) and in `@kdenza/gallery`; verified in-browser that
   typography inherits from context (40px in an `<h1>`, 11px in
   `<small>`), that both color modes resolve, and that flipping `target`
   to `_blank` in the gallery adds `rel`, the note and the icon live.
