# Cadenza

Design system + UX Engineering portfolio. The site is its own case study:
tokens → components → site, built with enterprise team practices.

## Stack and packages

A monorepo on **npm workspaces** (migrated from pnpm, see ADR-0006). Node
18.19.1 on the system, Node 24 LTS available in this environment — see
"Environment constraints" before touching tool versions.

| Package | What it is | Stack | Published? |
|---|---|---|---|
| `@kdenza/tokens` | W3C DTCG design tokens → CSS custom properties (light + dark) | Style Dictionary 5.x | Yes, public npm |
| `@kdenza/components` | Web Components, `cdz-` prefix | Lit 3 + TypeScript, no decorators | Yes, public npm |
| `@kdenza/gallery` | Component viewer with a live accessibility audit | custom-elements-manifest + axe-core | No (private) |
| `@kdenza/site` | Portfolio (consumes the components) | Vite 8 + TS | No (private) |

## Commands

```bash
npm install
npm run build      # tokens → components → analyze → site
npm run dev        # site in development mode (port 5173)
npm run gallery    # component gallery (port 5174)
npm test           # component tests (@web/test-runner + axe-core)
```

To publish a new version or consume the packages from another project, see
[docs/publishing.md](docs/publishing.md) — **no credential (npm token,
GitHub PAT) is ever pasted into a conversation with Claude or committed**:
`npm login` belongs in your own terminal. A token pasted into a chat has
to be considered compromised and rotated.

## Conventions

- Component prefix: `cdz-`. Package scope: `@kdenza/*` (the GitHub
  organisation is `kdenza`, not the personal account; `cadenza` was
  already taken — see ADR-0006).
- Tokens in 3 tiers: `global` (primitives) → `semantic` (roles) →
  `component` (per component). Never skip a tier — a new component
  references `semantic`, not `global` directly.
- Lit components **without decorators**: `static properties = {...}` +
  `declare` fields (not `@property()`). This is deliberate — it avoids
  Lit's class-field-shadowing bug without depending on `tsconfig`/bundler
  flags. See any component's `*.ts` for the exact pattern.
- Every component documents in its class JSDoc **which ARIA pattern it
  implements and why** (not what it does — the code already says that).
- Form components (`cdz-input`, `cdz-checkbox`) require `label`:
  `console.error` when missing, never `throw` (a misused prop should not
  take down the rest of the page). See ADR-0003.
- `disabled`: `cdz-button` uses `aria-disabled` (it stays focusable, so a
  screen reader can discover the action exists); form fields use **native**
  `disabled` (which excludes the value from `FormData`). This is a
  deliberate divergence between components, not an inconsistency.
- Light/dark is modelled in the `semantic` tier
  (`color.*.light.tokens.json` / `color.*.dark.tokens.json`), never in the
  component. Switching by OS preference is
  `@import ... (prefers-color-scheme: dark)` — zero JavaScript. On top of
  that there is a manual override (a button on the site): Style Dictionary
  also generates `tokens-dark-forced.css`/`tokens-light-forced.css` with a
  `[data-theme="..."]` selector instead of `:root` (higher specificity
  than a plain `:root`, even one behind a media query), and a synchronous
  inline script in every page's `<head>` applies the `data-theme` stored in
  `localStorage` (`cdz-theme`) before first paint, to avoid FOUC. See
  ADR-0002's amendment.
- **`:host([hidden]) { display: none }` is mandatory** in any component
  that sets `display` on its `:host`. The browser's `[hidden]` rule is UA
  origin and `:host` is author origin, so author wins and `hidden` stops
  working. A single test covers all of them. See ADR-0025.
- `custom-elements.json` is a generated artefact (`.gitignore`d, like
  `dist/`, but included in the published package — see ADR-0006) —
  regenerate with `npm run analyze -w @kdenza/components` after changing
  any component prop or event.
- `@kdenza/tokens` and `@kdenza/components` have real versions (semver)
  and `publishConfig` because they are published; `@kdenza/site` and
  `@kdenza/gallery` are `"private": true` and never are.
- **The repository is written in English; the site is in Spanish.** Split
  by audience, not by language — see ADR-0026. This includes the runtime
  console messages, which ship inside the published package.

## Environment constraints

The system has Node 18.19.1 at `/usr/bin/node` (root, do not touch without
sudo). There is also **Node 24 LTS installed at
`~/.local/share/node-v24`**, with priority on `PATH` (`~/.bashrc`) — any
new shell already uses Node 24 by default. `npm`, `gh`, and the project's
whole pipeline have been verified working under Node 24.

Tool versions are **now current** (August 2026): style-dictionary 5.x,
vite 8.x, TypeScript 7.x, `@web/test-runner` 1.x +
`@web/test-runner-chrome` (rather than playwright), axe-core 4.13. `npm
audit` reports **0 vulnerabilities**; the earlier lag had grown to 9
advisories (8 high), including prototype pollution in style-dictionary
4.x. See ADR-0023.

Two things learned during the upgrade, worth not tripping over again:

- **Vite 8 is no longer hoisted to the workspace root.** The binary lives
  at `packages/<pkg>/node_modules/.bin/vite`; any script or config
  pointing at `../../node_modules/.bin/vite` breaks.
- **TypeScript 7 emits exactly what 5.9 did** for this project (41 files
  identical byte for byte), including the class-field emission Lit's
  no-decorators pattern depends on. That was the real risk of the jump and
  it did not materialise.

## Architecture decisions

Full record in [`docs/decisions/`](docs/decisions) (ADRs). Start there
before assuming why something non-obvious is the way it is:

- **0001** — monorepo + Style Dictionary + Lit (the pnpm part was
  superseded by 0006).
- **0002** — visual identity (lilac/rose/blue), Figtree + Source Sans 3,
  dual-mode tokens (light/dark).
- **0003** — `cdz-input`'s pattern; amendment: enforcing a required
  `label`.
- **0004** — `@kdenza/gallery`: why custom-elements-manifest + axe-core
  rather than Storybook/Histoire. Amendment: a link to the gallery from
  the site, visible only in local development (`import.meta.env.DEV`) —
  still not deployed alongside the site.
- **0005** — `cdz-checkbox`: imperative `indeterminate`, zero new tokens.
- **0006** — pnpm → npm, and publishing
  `@kdenza/tokens`/`@kdenza/components` under the `@kdenza` scope
  (`cadenza` was already taken on GitHub). **Amendment:** the target moved
  from GitHub Packages to the **public npm registry**, because GitHub
  Packages requires authentication to *install* even public packages —
  friction that defeats the goal of the system being consumable from a
  portfolio. This implies `access: "public"` (scoped packages are private
  by default) and a real MIT licence. A latent bug turned up in passing:
  the `.npmrc` mapped `@cadenza`, a scope that no longer existed.
- **0007** — `cdz-radio`: native radio grouping does not cross shadow
  roots — a real limitation, documented and verified with a test, not a
  bug. Real coordination is left to a future `cdz-radio-group` molecule.
- **0008** — `cdz-text`: `as` (semantic tag) and `size` (visual style)
  independent — the first time with genuinely new typographic tokens
  (`heading-2/3`, `body-lg/sm`) across several atoms.
- **0009** — `cdz-select` (v1, superseded by 0010): `options` is a JS
  property (not a slot, a real `<select>`+shadow DOM limitation); the open
  popup could not be restyled (a real platform limit, unresolved at the
  time). The shared `warnIfLabelMissing` (`shared/required-label.ts`) was
  extracted and retrofitted into Input/Checkbox/Radio.
- **0010** — `cdz-popover`: a generic primitive (not an atom, its own
  category in `docs/roadmap.md`), ARIA-agnostic, based on the `popover`
  attribute + CSS Anchor Positioning (verified in-browser, not assumed).
  `cdz-select` was rebuilt on it using the APG "Select-Only Combobox"
  pattern — resolving the popup styling limitation ADR-0009 had left
  documented as a real limit rather than fixed.
- **0011** — `cdz-textarea`: same pattern as `cdz-input`, zero new tokens.
  The only genuinely new decision is `resize: vertical` (never `both`, so
  the layout cannot break) and `rows` instead of `type`.
- **0012** — `cdz-switch`: `role="switch"` over a native
  `<input type="checkbox">` (same approach as checkbox, without
  indeterminate). Zero new colour tokens, but it required verifying real
  contrast: no fixed thumb colour clears 3:1 against all four
  track-on/off × light/dark combinations — the already-existing
  `color.action.primary.text.default` role (the same one as checkbox's
  check) does resolve all of them.
- **0013** — `cdz-range`: the most fragmented native control to restyle
  (verified that unprefixed pseudo-elements still do not exist, so
  duplicated `::-webkit-*`/`::-moz-*` is required). Reuses ADR-0012's
  contrast table directly for the thumb (same four colours). Found and
  fixed a real binding-order bug: `.value` was applied before `min`/`max`
  in the template, and since lit-html applies bindings in order, the value
  was clamped against the native default `max` (100) on first render. No
  `required`, deliberately (a range is never "empty"). It also fixed a
  real gap in the gallery: `number` props were assigned as raw strings
  from the generic text control (which also affects textarea's `rows`).
  **Amendment:** the `::-moz-*` rules are now verified in Firefox 153 by
  sampling painted pixels, not `getComputedStyle`.

- **0014** — `cdz-file-input`: `value` cannot be set (a browser security
  barrier, not a design decision) → read-only `files` + `clear()`. The
  native input is clipped (never `display:none`, which would remove it
  from the tab order) and the visible chrome is drawn by the component,
  because the "no files" text lives in a **closed** shadow root and is
  localised by the browser, not the app. First case where an axe rule is
  deliberately scoped: the disabled contrast (3.03:1, exempt under WCAG
  1.4.3 and used by all 10 atoms) is only flagged here because the text
  sits in decorative spans.

- **0015** — `cdz-link`: the first atom that **inherits** typography
  rather than imposing it (it is inline content). No `disabled` (it does
  not exist in HTML for links — `aria-disabled` does not prevent the
  click, and removing `href` destroys the semantics; `cdz-button disabled`
  is what that is for). `target="_blank"` adds `rel="noopener"` (merged,
  not overwritten) and a translatable accessible notice. No `:visited`:
  the browser deliberately lies in `getComputedStyle` to prevent history
  sniffing, so it would be the only colour in the system impossible to
  verify with this project's methodology.

- **0016** — icon system: SVG, **never** an icon font (an icon font uses
  Unicode's Private Use Area, so to the browser it is text, and the whole
  set breaks if someone enables their own font such as OpenDyslexic).
  Sprite sheets are also ruled out: verified that `<use href="#id">` does
  not cross the shadow DOM. 24×24 grid, 20×20 live area (bounding the
  **stroke**, not the geometry), constant stroke 2, round caps. Registry
  in `components/src/shared/icons.ts`. Amendment: `cdz-icon` built on that
  registry — **decorative by default** (`aria-hidden`), meaningful only if
  given a `label` (`role="img"` + `aria-label`). Colour via
  `currentColor`, no prop. The gallery has a contact sheet of the whole
  set at 96px with the live area overlaid: it is the tool for judging
  optical weight when drawing new icons (at real size you cannot see it).

- **0017** — `cdz-badge` + status palette: the first component with
  **semantic variants**, and the first palette expansion since ADR-0002
  (there was no green and no amber). A new `color.status.*` semantic
  layer, forked per mode — any future alert/toast/table reuses it. All 20
  pairs verified twice (maths before choosing, and read back from the
  browser afterwards). The icon **reinforces** the variant for scanning,
  but what satisfies 1.4.1 is the badge's text — do not overstate that.

- **0018** — `cdz-spinner`: the first that **is** a live region
  (`role="status"` polite), deliberately the opposite of badge — a badge
  is already there when the page loads, a spinner appears because
  something started. That is the criterion for the rest of Feedback.
  First with animation: under `prefers-reduced-motion` the rotation is
  **replaced** by an opacity pulse (not frozen — a still ring looks
  broken), verified by reading the keyframes from the CSSOM.

- **0019** — `cdz-progress`: native `<progress>`. The first case where
  "native first" was **not** applied out of habit: here the only gain is
  semantics (not behaviour), so it won on two concrete tiebreakers rather
  than on the principle. Determinate only — indeterminate is
  `cdz-spinner`, because `appearance: none` kills that state's native
  animation. Documents the third false negative from a measurement tool
  (see the table in the ADR): when a measurement contradicts what is
  expected, suspect the measurement first.

- **0020** — `cdz-tooltip`: the central finding is that **the shadow DOM
  blocks name references in general** — both `aria-describedby` ids and
  CSS Anchor Positioning's `anchor-name` are *tree-scoped*. That is why
  the tooltip builds both of its auxiliary nodes (accessible description
  and bubble) in the **light DOM**, not in its shadow root. Note:
  `ariaDescribedByElements` discards a reference pointing into a shadow
  root **silently**, without error. It uses `popover="manual"` because
  `auto` popovers dismiss each other and would close an open
  `cdz-select`.

- **0021** — `cdz-divider`: **decorative by default** (`role="none"`),
  semantic only on request. It reaches the same default as `cdz-icon` for
  the **opposite** reason: with the icon the serious risk is silence (a
  control nobody can identify), here it is noise (a "separator" announced
  once per row). The rule they do share, and the one to remember: the
  default is the quieter option — which side is quiet depends on the
  component. No margin of its own: spacing belongs to the layout.

- **0022** — `cdz-avatar`: **meaningful by default**, deliberately
  breaking the rule 0016 and 0021 had been sharing. The refinement is what
  to remember: *the default is quiet when the loud option would have to be
  guessed* (`cdz-icon` would have to invent a label from the icon's
  `name`) *and loud when the correct string is already in hand* (here
  `name` is required for the initials, so the real name is already
  there). No colour hashed from the name: every generated colour would
  have to clear 4.5:1 in both modes and a hash cannot promise that. First
  component to treat text as Unicode (`Intl.Segmenter` for grapheme
  clusters, NFC output). Measured trap: `src=""` on an `<img>` fires
  `error`, not silence. Fourth measurement false negative:
  `getBBox({ stroke: true })` accepts the option and ignores it.

- **0023** — upgrading every tool: ADR-0006's lag had grown from 2 to
  **9 advisories** (8 high, including prototype pollution in
  style-dictionary 4.x). Now **0**. The transferable part is the method:
  compare generated artefacts byte for byte against a baseline, do not
  trust that it "compiles". TypeScript 7 emitted all 41 `.js` identical to
  5.9's, which is the only real proof it did not break the class-field
  emission Lit's no-decorators pattern depends on.

- **0024** — CI (GitHub Actions) and deployment to GitHub Pages. The step
  that justifies CI is `npm audit --audit-level=high`, not the build: it
  is what stops ADR-0023 repeating. The transferable part is what
  **preparing the deploy exposed**: the site's 7 ADR links had been broken
  all along (404 locally too), `dist/index.html` did not exist — exactly
  what ADR-0001 had predicted — and a demo requested an absolute path that
  escaped the project. None of the three failed in development. **The site
  is served from `/` and the pages live in `src/`, not `src/pages/`**;
  `base` is conditional on `NODE_ENV=production` because Pages serves from
  `/cadenza/` and the dev server from `/`.

- **0025** — `:host([hidden]) { display: none }` is **mandatory** in any
  component that sets `display` on its `:host`: the browser's `[hidden]`
  rule is UA origin and `:host` is author origin, so author wins and
  `hidden` stops working. It was missing from all 18. The deployed site
  found it — not the suite — with a link to `localhost` visible in
  production. The methodological lesson completes ADR-0019's: **suspecting
  the measurement cuts both ways**; this suspicion had already been raised
  and was withdrawn on a badly done check that said "fine" when it was
  broken.

- **0026** — documentation language: **English in the repository, Spanish
  on the site**, split by audience rather than by language. The repo was
  found split down the middle (ADR-0001–0015 English, 0016–0025 Spanish)
  through drift, not decision: a conversational preference was applied to
  the artefacts as well. A stated preference has a scope, and widening it
  silently decides something on someone's behalf.

- **0027** — `cdz-page-nav`, the first molecule: it owns state (which
  section is current) that none of its parts could own alone. Disclosure
  below the breakpoint, never a drawer; `aria-current="location"`, never
  `"page"`. It also **reintroduced ADR-0025's `hidden` bug five commits
  after documenting it**, which is why that rule was restated as being
  about any element given a `display`, not just `:host`.

- **0028** — tests that depend on the rendering pipeline. `@open-wc`'s
  async `fixture()` falls back to `requestAnimationFrame` when the mounted
  root has no `updateComplete` — so a plain `<div>` wrapper makes a test
  wait for a frame a headless runner never paints. It kept CI red for four
  commits while every local run passed. Four fixtures had the shape, not
  the two a first grep reported. Enforced now by
  `scripts/check-test-fixtures.mjs` as `pretest`. Also records that a test
  module which fails to import is **skipped silently** while the suite
  still reports green.

- **0029** — `cdz-radio-group`: **composing the atoms would have broken
  the semantics the atom was chosen for.** Native radio grouping does not
  cross shadow roots, so slotting `<cdz-radio>` children would have meant
  hand-reimplementing mutual exclusion, arrow keys, roving tabindex and
  set position — exactly what ADR-0007 picked a native radio to avoid. The
  group renders its own radios in one shadow root instead. Verified with
  **trusted** key events (`sendKeys` over CDP): a synthetic `KeyboardEvent`
  does not drive native radio behaviour, so a test built on one would be
  green and measuring nothing. Writing it exposed that ADR-0025's systemic
  `hidden` test claimed to walk the element registry and did not — leaving
  `cdz-page-nav` uncovered for five commits, including the ones where it
  reintroduced that very bug.

- **0030** — `cdz-avatar-stack`: the other half of ADR-0029. Stated baldly,
  that ADR is easy to misread as "molecules do not compose atoms". The real
  test is **who provides the guarantee**: composition is safe when the
  atom's guarantee travels with the element (an accessible name does), and
  unsafe when it comes from the platform relating that element to its
  siblings (radio grouping does), because a shadow root is exactly what
  breaks that relation. So this molecule composes the atom freely. A real
  `<ul>`/`<li>`, and people past `max` are **not rendered** rather than
  hidden, keeping the accessible experience at parity with the visual one.
  The stacking order was reversed **after looking at the page**: the
  conventional order clips each avatar's left edge, eating the first letter
  of every set of initials. No test would have caught it — both orders pass
  axe and produce the same a11y tree.

## Atom checklist

See [docs/roadmap.md](docs/roadmap.md) — all five atom categories are
closed, and every molecule identified while building them is done
(`cdz-page-nav`, `cdz-radio-group`, `cdz-avatar-stack`).

## Current status

**18 atoms complete, all five categories closed** — forms, text and
navigation, feedback, media and structure: `cdz-button`, `cdz-input`,
`cdz-checkbox`, `cdz-radio`, `cdz-text`, `cdz-select`, `cdz-textarea`,
`cdz-switch`, `cdz-range`, `cdz-file-input`, `cdz-link`, `cdz-icon`,
`cdz-badge`, `cdz-spinner`, `cdz-progress`, `cdz-tooltip`, `cdz-divider`,
`cdz-avatar`. Plus one primitive (not an atom): `cdz-popover`, on which
`cdz-select` was rebuilt (see ADR-0010), and three molecules:
`cdz-page-nav` (ADR-0027), `cdz-radio-group` (ADR-0029) and
`cdz-avatar-stack` (ADR-0030).

Published on the public npm registry: `@kdenza/tokens@0.1.0` and
`@kdenza/components@0.1.3`. The site is live at
<https://kdenza.github.io/cadenza/>, deployed by GitHub Actions on every
push. 297 tests, 0 vulnerabilities. See [README.md](README.md).
