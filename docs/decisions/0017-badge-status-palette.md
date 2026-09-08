# ADR-0017: `<cdz-badge>` and the status palette — the first real expansion of the visual identity

**Status:** Accepted
**Date:** 2026-08-02
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

First component in the roadmap's "Feedback" section, and the first in the
whole system to need **semantic variants**. The twelve atoms before it had
*states* (error, disabled, checked) but never variants: each did one thing
with one visual treatment.

That exposed a real gap in the identity: since ADR-0002 the system has
had lilac, rose, blue, red, ink and neutrals — **there is no green and no
amber**. A success or warning badge could not be built by reusing
anything.

## Decision

### The palette was expanded, with ADR-0002's discipline

It is the first time global colours have been added since ADR-0002, so the
same method was followed: **contrast calculated before choosing**, not
after something "looked right".

New global ramps: `green` and `amber` (100/300/700/900 each). `blue` and
`red` were extended with the steps they were missing (100/300/700/900 and
100/900 respectively), and `neutral` gained a `200`.

The hues were deliberately chosen muted and warm — a sage green and a
toasted amber rather than the saturated greens and yellows of a generic
framework — so they live alongside the identity's lilac and rose instead
of fighting them.

### A new semantic layer: `color.status.*`

`color.status.{neutral,info,success,warning,error}.{background,foreground}`,
forked per mode like the rest of the semantic layer. The badge never
references `green.700`: it references `status.success.foreground`. That is
what will let a future alert, toast or status table share exactly the same
colours without deciding them again.

Strategy per mode: in light, **muted background + strong text**; in dark,
**deep background + light text**.

### The 20 pairs, verified twice

First with relative-luminance maths before a single token was written, and
afterwards by **reading back from the browser** the computed values on the
finished component. The numbers matched to the hundredth, which confirms
the global → semantic → component → CSS custom property pipeline deforms
nothing along the way.

| Variant | Light text/chip | Light border/page | Dark text/chip | Dark border/page |
|---|---|---|---|---|
| neutral | 8.26:1 | 9.92:1 | 6.37:1 | 10.01:1 |
| info | 6.95:1 | 7.72:1 | 7.37:1 | 8.26:1 |
| success | 5.45:1 | 5.86:1 | 7.75:1 | 9.20:1 |
| warning | 5.77:1 | 6.16:1 | 7.70:1 | 9.06:1 |
| error | 5.44:1 | 6.04:1 | 4.67:1 | 5.14:1 |

All ten text pairs clear AA (4.5:1) and all ten borders exceed 3:1.

**A real failure during design:** the first candidate for `neutral` in
dark used `neutral.400` on `neutral.800` → **4.00:1**. That pair already
exists in the system, and ADR-0002 records it as the *disabled* treatment,
where WCAG 1.4.3 exempts it. Here it would be real content text, with no
exemption available. Resolved by adding `neutral.200` (6.37:1). The
mistake is instructive: **a colour pair approved for one role does not
automatically travel to another role**, which is exactly what ADR-0002
already warned about and happened again anyway.

### The border shares the text colour

The muted backgrounds sit very close to the page in luminance (≈1.1:1), so
without an outline the chip has no locatable edge. Using the text colour
as the border solves definition without inventing a third token, and
guarantees ≥3:1 against the page for free: that colour already had to
clear 4.5:1 as text.

### The icon reinforces; it is not what makes the badge accessible

There was **a claim of mine here that had to be corrected**. The first
version of the JSDoc and of the site copy said that without the icon the
variants would be communicated "by colour alone". That is false: the
badge's **text** ("Completado", "Fallido") is already a perfectly
sufficient non-chromatic signal for WCAG 1.4.1.

What the icon actually contributes is a shape cue that **survives
scanning**: in a long list of badges, someone who cannot separate the hues
gets a per-row hint without reading every label. That is a real
improvement, but it is reinforcement, not the compliance mechanism.

The genuine 1.4.1 risk is a badge whose text does not state the status —
`<cdz-badge variant="error">3</cdz-badge>`, where red is the only thing
meaning "errors". No icon repairs that; the answer is that the status
belongs in the text. It is said in the JSDoc because no API can detect it.

`hideIcon` is opt-out rather than opt-in, so the reinforced arrangement is
what you get without thinking about it.

**Known limit of that reinforcement at this size:** badge icons render at
`sm` (16px), and ADR-0016 records that `info` and `alert-circle` are not
tellable apart at that size. So the shape cue separates *info/error* from
*success/warning*, but does not separate info from error on its own. The
text does. Bumping them to `md` would fix it and leave them larger than
the 14px text they accompany, which reads worse — the trade was taken
knowingly.

### It is not a live region

The badge renders a bare `<span>` around the text. No `role="status"` and
no `aria-live`: a badge is **content**, and turning each one into a live
region would make them interrupt whatever the person is reading. That
behaviour belongs to a future alert/toast, where the content does arrive
after page load.

## Consequences

- **Easier:** any future component needing status semantics (alert, toast,
  table, error tooltip) references `color.status.*` and inherits the
  already-verified contrasts.
- **To revisit:** the badge is not dismissible. A badge with an "x" to
  close it is interactive, needs focus, an `aria-label` on the button and
  keyboard handling — that is a molecule, not this atom.
- **To revisit:** there is no size variant. If a smaller badge becomes
  necessary, the icon size has to be revisited alongside it (see the 16px
  limit above), not separately.
- **To revisit:** `green` and `amber` are only exercised here for now.
  Their 300/900 steps (the dark-mode ones) will not be genuinely tested
  until a second component uses them.

## Action Items

1. [x] Status palette designed with contrast calculated before choosing;
   one candidate discarded for failing (4.00:1) and replaced by a new
   `neutral.200`.
2. [x] Three layers: new global ramps, semantic `color.status.*` forked
   per mode, and `component/badge.tokens.json`.
3. [x] `<cdz-badge>` (Lit): five variants, icon by default on the semantic
   ones, `hide-icon` to remove it, no live region.
4. [x] Tests: slotted text, neutral without an icon, correct icon per
   variant, opt-out, icon outside the accessibility tree, absence of
   role/aria-live, accessibility across all five variants, and that the
   five resolve to five distinct colours (a token that failed to resolve
   would otherwise go unnoticed) — 158/158.
5. [x] Verified in-browser that the 20 computed pairs match the prior
   maths, in both modes.
6. [x] Corrected an overstated accessibility claim in the JSDoc and in the
   site copy.
