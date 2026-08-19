# ADR-0008: `<cdz-text>` — decoupling document structure from visual size

**Status:** Accepted
**Date:** 2026-07-28
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Fifth atom, and the first one that isn't a form control. The owner had
used this exact pattern at a previous job — a single text/typography
component with separate props for the semantic tag and the visual
style — and asked whether it was worth replicating here. It is: this is a
well-regarded pattern in serious enterprise design systems (Shopify
Polaris, GitHub Primer, and others all do some version of it), not an
idiosyncrasy of one workplace. It solves a real, common failure: someone
needing a heading that "looks small" reaches for `<h4>` instead of the
`<h2>` the document structure actually calls for, because the only tool
available conflates *how it looks* with *what it means*. That breaks
screen reader heading navigation — users jump between headings expecting
a logical h1→h2→h3 order, not one dictated by appearance.

Two decisions had to be made explicitly before writing code: whether this
should be a Web Component at all (a Shadow-DOM-encapsulated custom
element is arguably heavier than pure typography strictly needs), and
whether the current 4-role typography tier (`heading`, `body`, `label`,
`caption`) was granular enough for a real `size` scale.

## Decision

- **Built as a Web Component**, not plain CSS utility classes, for
  consistency with every other atom in Cadenza — its own token file,
  JSDoc-documented pattern, tests, and a gallery entry, same as
  `cdz-button`/`cdz-input`/etc. Named the trade-off explicitly before
  building: a CSS-class-only version would have been lighter (no Shadow
  DOM, no JS) and was a legitimate alternative — chosen against it for
  consistency with the rest of the library, not because it's objectively
  superior for pure typography.
- **Two independent props: `as` (structure) and `size` (appearance).**
  `as` picks the rendered tag (`h1`-`h6`, `p`, `span`); `size` picks the
  visual style (`heading-1/2/3`, `body-lg/md/sm`) and is completely free
  to disagree with `as` — `<cdz-text as="h2" size="body-md">` renders a
  real `<h2>` that's styled like body text. That combination is the
  entire point of the component, not an edge case.
- **`size` defaults from `as` when omitted**, rather than requiring both
  props on every use: `h1`→`heading-1`, `p`→`body-md`, and `h4`-`h6` all
  fall back to `heading-3` rather than getting their own dedicated visual
  step (a real design call: three visually-distinct heading sizes was
  judged enough for this system's actual heading depth; `h4`-`h6` exist
  for document structure, not for a fourth-through-sixth visual size).
- **Genuinely new tokens, not a fourth reuse.** Expanded the typography
  tier with `heading-2`, `heading-3`, `body-lg`, `body-sm` (two new global
  `font.size` steps — `5`/1.25rem, `6`/1.5rem — backing them). The prior
  three components (Checkbox, Radio, and most of Input) needed zero new
  tokens; this one couldn't, because a real size *scale* is the actual
  feature being built, not incidental to it. Existing `typography.heading`
  and `typography.body` were left untouched and reused directly as
  `heading-1` and `body-md` — no duplicate values, no risk of the two
  definitions drifting apart later.
- **Renders per-tag via a manual `switch`, not `lit/static-html.js`.**
  Lit's regular `html` tagged template can't parameterize an element's tag
  name — that's a genuine, non-obvious constraint, not an oversight. The
  `static-html` module supports it, but was skipped deliberately to avoid
  introducing another Lit sub-module for what's otherwise an 8-branch,
  utterly mechanical switch.
- **Explicitly does not validate document-wide heading order.** No h1
  uniqueness check, no "don't skip from h2 to h4" enforcement — a single
  isolated component has no visibility into sibling or ancestor headings
  elsewhere on the page. This component only solves the "picked the tag
  by appearance" failure; getting the overall sequence right across a
  whole document is still the author's job, same category of limitation
  as `<cdz-radio>`'s documented grouping gap (ADR-0007), applied to a
  different problem.
- **Verified, not assumed, that headings inside an open shadow root are
  discoverable by assistive technology.** Shadow DOM is a rendering/
  encapsulation boundary, not an accessibility-tree boundary — elements
  in an *open* shadow root (Lit's default) are part of the browser's
  flattened accessibility tree the same as light-DOM elements. Confirmed
  with axe-core running in a real Chrome instance (not a mocked DOM)
  across all eight `as` values, plus a direct check that `shadowRoot.mode`
  is `'open'`.

## Consequences

- **Easier:** any future content-heavy page (the portfolio's actual case
  studies, still unbuilt) already has a real typography primitive to
  reach for, with the size-independent-of-structure question already
  solved rather than improvised per page.
- **To revisit:** `h4`-`h6` sharing `heading-3`'s visual size is a
  reasonable default for now, but if a future page's content genuinely
  needs four or more visually distinct heading sizes, that's a token
  addition (`heading-4`, another `font.size` step), not a redesign.
- **To revisit:** no component-level enforcement exists (and, per the
  reasoning above, structurally can't exist) for correct document-wide
  heading order. If this becomes a recurring real mistake once the
  portfolio has more content pages, the right tool is a lint rule or a
  build-time check across rendered HTML, not something bolted onto this
  component.

## Action Items

1. [x] Global: `font.size.5`/`font.size.6`. Semantic: `heading-2`,
   `heading-3`, `body-lg`, `body-sm` (existing `heading`/`body` reused
   as-is for `heading-1`/`body-md`, not duplicated).
2. [x] `component/text.tokens.json`, `<cdz-text>` (Lit): `as`/`size` split,
   default-size-from-tag mapping, manual tag switch.
3. [x] Tests: default tag/size, explicit `as`, size overriding the
   `as`-inferred default, slotted content, accessibility across all eight
   `as` values (axe-core, real Chrome), shadow-root-open heading
   discoverability — 44/44 passing across all five components.
4. [x] Showcased on the design-system page with the central example
   (`as="h2" size="body-md"`) called out explicitly, not buried among
   other states; added to `@cadenza/gallery`'s `ENUM_HINTS` for both `as`
   and `size`, including a fix for enum controls whose *default* is an
   empty/inferred value rather than always one of the listed options.
