# ADR-0002: Visual identity — lila y rosa, Figtree + Source Sans 3, tokens de doble modo

**Status:** Accepted
**Date:** 2026-07-21
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

ADR-0001 shipped the pipeline with placeholder colors (a generic corporate
blue) chosen only to prove the tokens → component → site chain worked, not
to express anything about Cadenza itself. This ADR replaces that placeholder
with a real visual identity, decided through an explicit brief rather than
guessed:

- **Personality:** cálida y humana + editorial, con voz propia (explicitly
  *not* "técnica y precisa" or "minimalista y silenciosa" — the identity
  should read as personal, not generic enterprise chrome).
- **Typography:** sans humanista y cálida.
- **Light and dark from day one** — modeled in the token layer now, since
  retrofitting a mode dimension onto an already-built semantic tier is more
  expensive than designing it in from the start.
- **Color:** left open for exploration. Two rounds of proposals (rendered as
  actual swatches + button mockups, not hex codes in a table) narrowed this
  from three initial directions (terracota/tinta, tinta/ámbar, salvia/arena)
  to a lilac-based pairing, landing on **lila y rosa** over lila y azul —
  the owner's read was that rosa felt more "acorde a mí misma."

## Decision

- **Primary/interactive color: lilac.** Used for `<cdz-button>`'s fill and
  body links — one color owns the "interactive" role.
- **Rose is decorative-only**, not interactive: it appears as the accent bar
  under the site's `<h1>` and is reserved for future badges/illustrations.
  It was never wired into anything that carries text, so its contrast
  headroom didn't have to clear the 4.5:1 text bar (see below).
- **Focus ring: blue, deliberately decoupled from the action color.**
  `color.focus.ring` no longer aliases `color.lilac.*` — it points at
  `color.blue.500` directly, the same value in both light and dark files (no
  per-mode fork needed, unlike the button fill). Reasoning, not just taste:
  reusing rose here would give rose two unrelated jobs (decorative accent
  *and* functional focus signal), which is exactly what the semantic tier
  exists to prevent — one token, one meaning. Reusing lilac ties "focus" to
  whatever the current primary action color happens to be, which breaks the
  day a future component has its own different action color (a red "danger"
  button, say) — its focus ring would then mismatch every other component's.
  A dedicated, system-wide focus color stays identical everywhere regardless
  of what's focused, and blue is also the platform default users already
  associate with "keyboard is here." Blue also had the larger contrast
  margin of the two candidates (see table below) — the UX argument and the
  numbers agreed, not by coincidence: distinctiveness needs *from* the page
  background is often the same requirement contrast math checks for.
- **Blue's role is exactly this — not "reserved" anymore.** The owner asked
  to keep blue for something rather than lose it after the lila+azul
  direction wasn't picked; the focus ring turned out to be its concrete job,
  found while tuning accessibility rather than assigned up front.
- **Typography pairing:** Figtree for display/headings (`typography.heading`,
  new semantic token), Source Sans 3 for UI text and body copy
  (`typography.button` and the site's `font-family-base`) — the owner liked
  both fonts from the proposal, so the resolution was to pair them by role
  rather than pick one and drop the other.
- **Dual-mode token architecture:** `global` tokens stay mode-stable (raw
  hex, one ramp shared by both themes — e.g. `neutral.100`/`neutral.800` are
  reused as light-mode-disabled-bg and dark-mode-disabled-bg respectively,
  not duplicated per mode). Only the **semantic** color tier forks:
  `semantic/color.light.tokens.json` and `semantic/color.dark.tokens.json`
  define the same token paths (`color.action.primary.background.default`,
  `color.page.background`, `color.text.body`, etc.) with different global
  references. `component/button.tokens.json` didn't need to change at all —
  it references semantic paths by name, and both mode files provide those
  names. That the component tier required zero edits is the actual proof
  the three-tier architecture from ADR-0001 holds up under a real
  requirement, not just the original single-mode case.
- **Build mechanism:** `style-dictionary.config.js` is no longer a static
  config consumed by the SD CLI — it's a small Node script that instantiates
  Style Dictionary twice (once per mode) and writes `tokens-light.css` and
  `tokens-dark.css`. `@cadenza/components`' `styles/tokens.css` imports both:
  light unconditionally, dark behind
  `@import '...tokens-dark.css' (prefers-color-scheme: dark);` — a plain CSS
  conditional import, so mode-switching needs zero JavaScript and responds
  to the OS-level preference automatically.

## Key technical finding: vivid fills need dark text, not always white

Button fill colors were verified against actual contrast math (WCAG relative
luminance), not chosen by eye, and this surfaced something worth recording
because it isn't intuitive: **a color that passes AA with white text in
light mode can fail it in dark mode**, if dark mode's version of that color
has to be lightened to stay visible against a near-black page background.

Concretely: light mode's button fill (`lilac.700`, `#7A5197`) gives white
text 6.08:1. Naively reusing a *lighter* lilac for dark mode so it would
still stand out against the near-black page background
(`surface.900`, `#211A26`) breaks the text pairing — `#9B6FBE` only gives
white text 3.88:1, below the 4.5:1 minimum. The fix wasn't a lighter lilac
with white text; it was a lighter lilac (`lilac.500`, `#B08FCB`) paired with
**dark ink text** (`color.ink.900`, `#2C2230` — 5.54:1) instead. This is the
same phenomenon documented for the amber option that didn't get chosen in
the first round of proposals — it showing up again in the winning direction
means it's a pattern to expect, not a one-off: **check text-on-fill contrast
per mode, don't assume the light-mode text color choice survives into
dark mode.**

All verified pairs (light / dark):

| Role | Light | Dark |
|---|---|---|
| Button fill, default | `#7A5197` + white text — 6.08:1 | `#B08FCB` + ink text — 5.54:1 |
| Button fill, hover/active | `#6B4587` + white text — 7.43:1 | `#BFA0D6` + ink text — 6.68:1 |
| Button fill vs. page bg (non-text, ≥3:1) | 5.60:1 | 6.16:1 |
| Focus ring (`#5B7FC7`) vs. page bg (≥3:1) | 3.64:1 | 4.28:1 |
| Disabled (exempt from AA, checked anyway) | 3.03:1 | 4.00:1 |
| Body text vs. page bg | 13.79:1 | 13.88:1 |

Rose was also checked as a focus-ring candidate before blue was picked:
3.29:1 (light) / 4.74:1 (dark) — technically clears the 3:1 minimum but with
much thinner margin in light mode (≈10% headroom vs. blue's ≈20%), on top of
the semantic-collision problem above. Neither rose nor the blue have been
pushed through a solid-fill-with-white-text case (3.57:1 and 3.96:1
respectively — both below 4.5:1); that's irrelevant for blue's actual job
(a 2px outline, not a text-bearing fill) but would become a blocking
question if either were ever proposed for one.

## Options Considered

Documented in-conversation with real swatches rather than here in prose —
summarized for the record:

1. **Terracota y tinta** (Work Sans) — safe, warm, highest-margin contrast
   (5.4:1). Rejected: didn't feel distinct enough as "voz propia."
2. **Tinta y ámbar** (Figtree) — most editorial/dramatic; first place the
   vivid-fill-needs-dark-text finding showed up (ámbar fails AA with white
   at 3.34:1, passes at 4.98:1 with ink). Rejected in favor of a lilac base
   but validated the technique reused in the final decision.
3. **Salvia y arena** (Source Sans 3) — calmest option, best raw contrast
   margin (7.4:1), but reads closer to "wellness product" than "enterprise
   design system case study." Rejected on tone fit.
4. **Lila y cielo** (lilac + soft blue) — runner-up. Reads more
   cool/thoughtful than warm. The blue from this direction is the one now
   reserved rather than discarded.
5. **Lila y rosa** (lilac + warm rose) — **selected.** Warmest of the
   lilac-based options, closest fit to "cálida y humana" + "voz propia."

## Consequences

- **Easier:** any future component just needs its own `component/*.tokens.json`
  referencing the existing semantic roles (`color.action.primary.*`,
  `color.text.body`, etc.) — the mode-forking is already solved once, at the
  semantic tier, and doesn't need re-solving per component.
- **Easier:** dark mode is "free" for anything built on top of these
  semantic tokens going forward — no per-component dark-mode logic, no JS
  toggle to maintain.
- **Harder / to revisit:** fonts load from `fonts.googleapis.com` at
  runtime (Figtree, Source Sans 3) — an external dependency and a
  render-blocking request the moment this needs to be fast or work offline.
  Self-hosting the font files becomes worth doing once the site has real
  traffic; not worth it for a two-page skeleton today.
- **To revisit:** rose and blue have never been tested as a solid fill with
  white text (both fail 4.5:1 at their current values). If either gets
  promoted to a role that carries text later (a secondary button variant, a
  tag/badge), it needs the same contrast pass the primary lilac already
  got — don't assume it'll just work.
- **Easier, going forward:** every future component's focus state is
  already solved — reference `color.focus.ring`, done. No component should
  ever derive its own focus color from its own action color again.
- **To revisit:** `neutral.{100,400,500,800}` is one ramp read from both
  ends depending on mode (light disabled state reads the light end, dark
  disabled state reads the dark end). This works today because there's
  exactly one component consuming it; if a second component needs a
  *different* disabled treatment, confirm the shared ramp still serves both
  before assuming it does.

## Action Items

1. [x] Global tier: lilac/rose/blue/ink/surface/neutral ramps defined with
   verified contrast (see table above).
2. [x] Semantic tier forked into `color.light.tokens.json` /
   `color.dark.tokens.json`; `component/button.tokens.json` left untouched.
3. [x] Style Dictionary rebuilt as a two-theme Node script; conditional
   `@import` wires dark mode with no JavaScript.
4. [x] `<cdz-button>` fallback values, site fonts, and `global.css` updated
   to the new identity; verified in-browser in both color schemes.
5. [x] Focus ring decoupled from the action color and given its own
   dedicated blue token, verified against both page backgrounds.
6. [ ] Self-host Figtree/Source Sans 3 instead of Google Fonts before this
   site is meant to be fast or reliable in production.
