# ADR-0014: `<cdz-file-input>` — a security boundary in the API, a closed shadow root, and the first axe finding we deliberately scope out

**Status:** Accepted
**Date:** 2026-07-29
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Tenth atom, and the last one in the "Formularios" section of
`docs/roadmap.md`. A file picker looks like the simplest remaining
control and is in practice the one with the most non-obvious platform
constraints — two of which are *security* boundaries rather than styling
ones, which no previous atom had to deal with.

## Decision

### `value` is not settable — a browser security boundary, not a design choice

Every other form atom in this project (`<cdz-input>`, `<cdz-textarea>`,
`<cdz-select>`, `<cdz-range>`) exposes a writable `value`. This one
cannot, and the divergence is enforced by the platform, verified
directly:

```
input.value = 'C:\\fakepath\\cv.pdf'
→ InvalidStateError: Failed to set the 'value' property on
  'HTMLInputElement': This input element accepts a filename, which may
  only be programmatically set to the empty string.
```

The reason is sound and worth stating plainly: if a page could pre-fill a
file input, it could silently upload arbitrary files off a visitor's disk
on form submission. So the API exposes:

- `files` — a **read-only** getter returning `File[]`. A writable version
  couldn't be honored by the platform, so offering one would be a lie.
- `clear()` — a method wrapping the *one* mutation the platform does
  permit (setting `value` to `''`).

A test asserts the platform actually throws, so this constraint is
recorded as executable documentation rather than a comment someone might
later "fix" by adding a `value` property that can never work.

### The visible chrome is drawn by this component, because half the native rendering is unreachable

`::file-selector-button` **is** supported (verified) — unlike
`<input type="range">`'s still-unshipped standard pseudo-elements
(ADR-0013), the button here could have been restyled in place. That
wasn't the blocker.

The blocker is the *other* half: the "no file chosen" text lives in a
**closed** UA shadow root (verified: `input.shadowRoot` is `null`). It
can't be styled, read, or replaced — and the browser localizes it from
*its own* language setting, not the page's. On this Spanish-language
site opened in an English browser, native rendering would put "No file
chosen" in the middle of Spanish UI with no way to correct it. That's not
a cosmetic gap; it's the application losing control of its own copy.

So the native input is kept as the real control and visually hidden,
while this component draws the trigger label and the filename itself.
Both are configurable (`triggerText`, `placeholder`) and therefore
translatable by the consumer.

**This is a cheaper version of the same trade-off as `<cdz-select>`'s
rebuild (ADR-0010), and worth contrasting:** there, the native popup
couldn't be styled *at all*, so the entire interaction had to be
reimplemented on `<cdz-popover>` (keyboard, ARIA, focus management —
genuinely expensive). Here, nothing about the interaction is
reimplemented. The native input still owns focus, keyboard activation,
the file picker, and form participation; only the *painted surface* moves
into our control. Same instinct, an order of magnitude less risk.

### Visually hidden must mean clipped, never `display: none`

The native input is hidden with the clip-based "visually hidden but
focusable" technique. This is the load-bearing detail of the whole
component: `display: none` or `visibility: hidden` would remove the only
keyboard-reachable part of the control from the tab order entirely.

Verified both directions rather than trusting the pattern — and the first
attempt at verifying it produced a *false* result (a stale
`activeElement` reading from an element that was already focused before
being hidden), which was caught and re-run cleanly:

| Technique | Takes focus? |
|---|---|
| `display: none` | No — focus stayed on the previously focused control |
| clipped (`clip-path: inset(50%)`) | Yes |

Confirmed end-to-end afterwards with a real keyboard `Tab` in the browser:
focus lands on the clipped input, `:focus-visible` matches, and the ring
renders on the visible box.

The focus ring is drawn on the box via `.control:has(input:focus-visible)`,
since a ring on a 1px clipped element would be invisible. `:has()` was
already established in this codebase by `select.styles.ts`.

### The visible trigger and filename are `aria-hidden`

They duplicate what the native input already exposes — its accessible
name (from the `<label for>`, same as every other atom) and its
selected-file state. Leaving them exposed would make a screen reader
announce the same information twice.

### Zero new color tokens; the field visual language, not the button one

`component/file-input.tokens.json` reuses `color.form.*` — the control
is styled as a **field**, like `<cdz-input>`/`<cdz-select>`, not as a
button. This was a deliberate choice over reusing `color.action.primary.*`
for the trigger: a file trigger styled identically to `<cdz-button>` would
compete visually with the real submit button in any form containing both,
creating a false hierarchy. Styled as a field, it reads as "a thing you
fill in," which is what it is.

The one place an action color is used is the trigger *text*
(`color.action.primary.background.default`), to signal clickability. That
token had only ever been validated as a **fill** before (ADR-0002's
non-text 3:1 threshold), so it was re-checked as text against the field
background — exactly the "don't assume a color validated for one role
works in another" warning ADR-0002 itself raised:

| Pair | Ratio | AA text (4.5:1) |
|---|---|---|
| lilac.700 text on surface.50 (light) | 5.60:1 | pass |
| lilac.500 text on surface.900 (dark) | 6.16:1 | pass |
| ink.900 filename on surface.50 | 14.03:1 | pass |
| ink.50 filename on surface.900 | 13.88:1 | pass |
| neutral.700 placeholder on surface.50 | 5.41:1 | pass |
| neutral.400 placeholder on surface.900 | 6.28:1 | pass |

### The first axe finding this project deliberately scopes out

axe reports a `color-contrast` violation on the **disabled** state: the
trigger and filename text come out at 3.03:1 in light mode.

That number is not new and not a mistake — it is the project-wide
disabled treatment (`color.form.text.disabled` on
`color.form.background.disabled`), recorded in ADR-0002's own table as
"Disabled (exempt from AA, checked anyway) | 3.03:1 | 4.00:1" and used
identically by all nine previous atoms. WCAG 1.4.3 explicitly exempts
text that is part of an inactive user interface component.

The reason axe flags it *here specifically* and nowhere else: in every
other atom the disabled text sits inside a natively-`disabled` form
control, which axe's contrast rule skips. Here the visible text is in
decorative `<span>`s that axe cannot associate with the disabled input,
so it correctly reports the ratio and cannot know about the exemption.

Two options were weighed. Darkening the disabled text just for this
component would pass axe but make one atom's disabled state visibly
inconsistent with the other nine. Keeping the shared treatment preserves
consistency and remains WCAG-conformant. The second was chosen, and the
cost is paid explicitly: the disabled-state test asserts accessibility
with `ignoredRules: ['color-contrast']` and a comment explaining exactly
why, rather than weakening the assertion globally or leaving a red test.

**Verified, not assumed, that this leaks into the gallery:** toggling
`disabled` in `@kdenza/gallery` does surface
`[serious] Elements must meet minimum color contrast ratio thresholds
(2 elemento(s))`. That is left visible on purpose — the gallery reports
real analyzer output, and suppressing it there would make the tool less
trustworthy for every other finding. This ADR is the explanation it
points to.

## Consequences

- **Easier:** the pattern "keep the native control for behavior, draw the
  chrome for language and style control" is now proven at two very
  different cost levels (this atom, cheaply; `<cdz-select>`, expensively)
  — a future atom can pick the cheap version knowingly.
- **To revisit:** no drag-and-drop. A real, common enhancement for file
  inputs, and genuinely additive (drop target, `dragover` state, reading
  `DataTransfer.files`) rather than a fix — deliberately out of scope for
  the atom, and a good candidate for a future molecule.
- **To revisit:** no per-file removal when `multiple` is set. The
  component summarises as "N archivos seleccionados"; removing one file
  from a selection requires rebuilding a `FileList` via `DataTransfer`,
  which is doable but is list-management UI, not atom scope.
- **To revisit (project-wide, not this atom):** the disabled contrast
  exemption is now load-bearing in a place static analysis can't see. If
  more hand-drawn-chrome components follow, it may be worth revisiting
  whether the system's disabled text should simply meet 4.5:1 everywhere
  — which would remove the exemption argument entirely rather than
  re-litigating it per component.

## Action Items

1. [x] Verified the platform constraints in-browser before designing:
   `::file-selector-button` support, the `value` `InvalidStateError`, the
   closed UA shadow root, and clipped-vs-`display:none` focusability
   (including catching and re-running one badly-constructed probe).
2. [x] `component/file-input.tokens.json` — zero new color roles; the
   action color's first use as *text* re-verified against the 4.5:1 bar.
3. [x] `<cdz-file-input>` (Lit): clipped native input, component-drawn
   trigger/filename, click forwarding for pointer, `:has()`-based focus
   ring, read-only `files`, `clear()`, no settable `value`.
4. [x] Tests: label association, focusability of the hidden input,
   accessibility (empty/selected/error, and disabled with the documented
   rule scoped out), placeholder → filename → multi-file summary,
   `files` getter, `clear()`, the platform's own `value` rejection,
   `accept`/`multiple` pass-through, helper/error wiring, disabled
   click suppression, label warnings — 122/122 across all components.
5. [x] Showcased on the design-system page and in `@kdenza/gallery`;
   verified in-browser: real keyboard `Tab` reaches the control and shows
   the ring on the box, all light/dark forks resolve correctly, long
   filenames ellipsis cleanly, and the documented disabled-state axe
   finding reproduces in the gallery exactly as described above.
