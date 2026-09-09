# Cadenza

**An accessible, simple design system — and the case study of how it was
built.**

🔗 [Live site](https://kdenza.github.io/cadenza/) ·
📦 [`@kdenza/components`](https://www.npmjs.com/package/@kdenza/components) ·
📐 [`@kdenza/tokens`](https://www.npmjs.com/package/@kdenza/tokens)

```bash
npm install @kdenza/components
```

## What this is

Cadenza is a small design system of framework-agnostic Web Components,
built to be **accessible by default rather than accessible on request**.
Every component ships with its ARIA pattern already decided, its colour
contrast measured, and the reasoning behind both written down.

It is also a portfolio. The site is not a description of the work — it is
the work, dogfooding itself: the same components, the same tokens, the
same build.

## Why it exists

Most design systems are documented by what they *contain*. This one is
documented by what was *decided*, and why — because in practice the
expensive question is never "which components exist", it is "why does this
one behave that way, and what happens if I change it".

That is why there are **26 architecture decision records** in
[`docs/decisions/`](docs/decisions), one per meaningful decision, each with
its trade-offs and the things deliberately left out. A sample of what they
cover:

- Why the icons are SVG and never an icon font — an icon font lives in
  Unicode's Private Use Area, so it breaks entirely for anyone using
  OpenDyslexic or Windows high contrast ([ADR-0016](docs/decisions/0016-icon-system-grid.md)).
- That the shadow DOM blocks **tree-scoped name references in general** —
  both `aria-describedby` ids and CSS `anchor-name` — which is what forces
  the tooltip's architecture ([ADR-0020](docs/decisions/0020-tooltip-component.md)).
- When an accessibility default should be quiet and when it should be
  loud, and why `cdz-icon` and `cdz-avatar` land on opposite answers
  ([ADR-0022](docs/decisions/0022-avatar-component.md)).
- Four separate cases where a measurement tool returned a false negative,
  tabulated so the pattern is visible
  ([ADR-0019](docs/decisions/0019-progress-component.md)).

Nothing here is asserted from documentation alone. Contrast ratios are
read back from the browser, CSS support is probed before being relied on,
and claims that turned out to be wrong are corrected in place rather than
quietly edited out.

## How it is built

| | |
|---|---|
| **Components** | [Lit 3](https://lit.dev) — Web Components, no framework required |
| **Language** | TypeScript (strict, and deliberately without decorators) |
| **Tokens** | W3C [DTCG](https://tr.designtokens.org/) JSON → [Style Dictionary](https://styledictionary.com) → CSS custom properties |
| **Build** | Vite 8 · npm workspaces |
| **Tests** | [@web/test-runner](https://modern-web.dev/docs/test-runner/overview/) in real Chrome, with [axe-core](https://github.com/dequelabs/axe-core) accessibility assertions — 297 tests |
| **API docs** | [custom-elements-manifest](https://custom-elements-manifest.open-wc.org/) analyzer |
| **CI** | GitHub Actions: build, tests and `npm audit` on every push |

Tokens are modelled in **three tiers** — `global` (primitives) →
`semantic` (roles) → `component` — and a component never skips a tier.
Light and dark are modelled only in the semantic tier, so switching themes
requires no JavaScript at all for the common case.

## Packages

| Package | What it is | Published |
|---|---|---|
| [`@kdenza/tokens`](packages/tokens) | Design tokens (W3C DTCG) via Style Dictionary → CSS custom properties, light + dark | npm, public |
| [`@kdenza/components`](packages/components) | 18 Web Components plus one primitive, prefixed `cdz-` | npm, public |
| [`@kdenza/gallery`](packages/gallery) | Component viewer generated from `custom-elements.json`, with a live axe-core audit | Private |
| [`@kdenza/site`](packages/site) | The portfolio site, consuming the components | Private |

## Using it

```bash
npm install @kdenza/components
```

```js
import '@kdenza/components';
import '@kdenza/components/dist/styles/tokens.css';
```

```html
<cdz-button>Send</cdz-button>
<cdz-input label="Name"></cdz-input>
```

A bundler is required (Vite, webpack, Rollup, Parcel — any of them). See
[docs/publishing.md](docs/publishing.md) for why, and for the Angular
note.

## Developing

```bash
npm install
npm run build      # tokens → components → analyze → site
npm run dev        # site in development mode (port 5173)
npm run gallery    # component gallery (port 5174)
npm test           # component tests
```

## Status

**All five atom categories are closed** — forms, text and navigation,
feedback, media and structure — with 18 atoms, one reusable primitive and
three molecules:

`cdz-button` · `cdz-input` · `cdz-checkbox` · `cdz-radio` · `cdz-text` ·
`cdz-select` · `cdz-textarea` · `cdz-switch` · `cdz-range` ·
`cdz-file-input` · `cdz-link` · `cdz-icon` · `cdz-badge` · `cdz-spinner` ·
`cdz-progress` · `cdz-tooltip` · `cdz-divider` · `cdz-avatar` ·
`cdz-popover` *(primitive)* · `cdz-page-nav` *(molecule)* ·
`cdz-radio-group` *(molecule)* · `cdz-avatar-stack` *(molecule)*

Plus a hand-drawn icon set of 10, all on one grid.

What comes next are molecules — see [docs/roadmap.md](docs/roadmap.md).

## Documentation

- [`docs/decisions/`](docs/decisions) — the 26 ADRs. The best place to
  start if you want to know why something is the way it is.
- [`docs/roadmap.md`](docs/roadmap.md) — what exists, what is next.
- [`docs/publishing.md`](docs/publishing.md) — releasing and consuming the
  packages.

Documentation in this repository is written in English; the site is in
Spanish. The reasoning is in
[ADR-0026](docs/decisions/0026-documentation-language.md).

## License

MIT © Mónica Castillo
