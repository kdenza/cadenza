# Atom roadmap

A checklist of the basic HTML controls Cadenza aims to cover, organised by
category. Update this list when an atom is *finished*, not when it is
started — it is a record of what exists, not a sprint plan. It also tracks
the "Primitives" section (internal building blocks, not atoms) and "After
the atoms" (molecules), with the same criterion.

**All five atom categories are closed** (18 atoms + 1 primitive), and the
first molecule is built. See the end of this file.

Heading/Paragraph are not listed as separate items: `cdz-text` (see
[ADR-0008](decisions/0008-text-component.md)) already covers both with a
single API (`as` + `size`), so there is no need for a component per tag.

## Forms

- [x] Button — [ADR-0001](decisions/0001-monorepo-tokens-lit.md)
- [x] Input (text) — [ADR-0003](decisions/0003-input-component.md)
- [x] Checkbox — [ADR-0005](decisions/0005-checkbox-component.md)
- [x] Radio — [ADR-0007](decisions/0007-radio-component.md)
- [x] Select (dropdown) — [ADR-0009](decisions/0009-select-component.md),
      rebuilt in [ADR-0010](decisions/0010-popover-primitive-and-select-rebuild.md)
- [x] Textarea — [ADR-0011](decisions/0011-textarea-component.md)
- [x] Switch / toggle — [ADR-0012](decisions/0012-switch-component.md)
- [x] Range (slider) — [ADR-0013](decisions/0013-range-component.md)
- [x] File input — [ADR-0014](decisions/0014-file-input-component.md)

## Content / typography

- [x] Text (heading + paragraph unified) — [ADR-0008](decisions/0008-text-component.md)

## Text and navigation

- [x] Link — [ADR-0015](decisions/0015-link-component.md)

## Feedback and status

- [x] Badge / tag — [ADR-0017](decisions/0017-badge-status-palette.md).
      Brought in the status palette (`color.status.*`), reusable by any
      component needing status semantics.
- [x] Spinner / loading — [ADR-0018](decisions/0018-spinner-component.md).
      First with a live region (contrasting with badge) and first with
      animation, i.e. the first to resolve `prefers-reduced-motion`.
- [x] Progress bar — [ADR-0019](decisions/0019-progress-component.md).
      Determinate only; indeterminate is `cdz-spinner`.
- [x] Tooltip — [ADR-0020](decisions/0020-tooltip-component.md). It was
      indeed the hardest: it forced the discovery that the shadow DOM
      blocks both ARIA references by id and CSS anchoring by
      `anchor-name`, both for being *tree-scoped*.

## Media

- [x] Icon (wrapper) — [ADR-0016](decisions/0016-icon-system-grid.md).
      Current set: 10 icons (`chevron-down`, `chevron-up`, `x`, `check`,
      `dash`, `info`, `alert-circle`, `alert-triangle`, `external-link`,
      `user`). They are added to the registry as they become necessary;
      always audit them in the gallery's contact sheet before calling them
      done.
- [x] Avatar — [ADR-0022](decisions/0022-avatar-component.md). Photo →
      initials → generic icon, and the last two are siblings, not one
      degraded from the other. **Meaningful by default**, deliberately
      breaking ADR-0021's rule: the default is quiet when the loud option
      would have to be guessed, and loud when the correct string is
      already in hand. No colour derived from the name (a hash cannot
      promise contrast).

## Structure

- [x] Divider — [ADR-0021](decisions/0021-divider-component.md).
      Decorative by default (`role="none"`), semantic only on request:
      most lines in an interface are visual furniture, not thematic
      breaks. Same default as `cdz-icon` for the opposite reason — there
      the serious risk is silence, here it is noise.

## Primitives

Not atoms: they are not UI pieces used on their own, they are building
blocks other components consume internally. They are documented and
versioned like an atom (tokens/API → implementation → ADR), but live in
their own category because they have no place in the Atomic Design
hierarchy.

- [x] Popover (`cdz-popover`) — a generic floating panel (trigger + panel
      positioned with `popover` + anchor positioning), with the full ARIA
      pattern reimplemented by hand (it does not delegate to a native
      `<select>`). First consumer: it replaces `cdz-select`'s
      unstyleable native popup — see
      [ADR-0010](decisions/0010-popover-primitive-and-select-rebuild.md)
      (the original limitation is documented in
      [ADR-0009](decisions/0009-select-component.md)).
      Intended for reuse in future menus and comboboxes.

## After the atoms

- [x] `cdz-page-nav` — [ADR-0027](decisions/0027-page-nav-first-molecule.md).
      A table of contents for the sections of the current page. The first
      component past the atom line, and the test that settles the
      category: it owns state — which section is current — that none of
      its parts could own alone. Disclosure below the breakpoint, never a
      drawer; `aria-current="location"`, never `"page"`.

Molecules already identified while building the atoms, still to do:

- [x] `cdz-radio-group` —
      [ADR-0029](decisions/0029-radio-group-composition-that-breaks-semantics.md).
      It does **not** coordinate several `cdz-radio`, which is what this
      entry originally assumed. Native grouping does not cross shadow
      roots, so composing the atoms would have meant reimplementing by
      hand the four things ADR-0007 chose a native radio to get for free.
      The group renders its own radios in one shadow root instead.
- `cdz-avatar-stack` — several overlapping avatars with a "+3" overflow.
  Needs its own group semantics, same as `cdz-radio-group` — see
  [ADR-0022](decisions/0022-avatar-component.md).
