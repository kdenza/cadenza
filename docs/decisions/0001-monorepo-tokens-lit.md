# ADR-0001: Monorepo (pnpm) + Style Dictionary (W3C DTCG) + Lit Web Components

**Status:** Accepted
**Date:** 2026-07-21
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Cadenza is a personal portfolio that is also meant to work as an enterprise-grade
design system case study: tokens, components, and documentation built and
versioned together, the way a design systems team would run it. Before
committing to more than one component, the goal for this first session was to
validate the full pipeline — **tokens → component → site** — end to end with a
single component (`<cdz-button>`), so any architectural mistake surfaces while
the cost of changing course is still low.

Three coupled decisions had to be made together, because each one constrains
the others: how the repo is organized, how design tokens are authored and
distributed, and what a "component" actually compiles down to.

## Decision

- **Monorepo via pnpm workspaces.** `packages/tokens`, `packages/components`,
  and `packages/site` live in one repo under `pnpm-workspace.yaml`, linked
  with the `workspace:*` protocol. `pnpm` was chosen over npm/Yarn workspaces
  for its strict, symlinked `node_modules` (no phantom dependencies) and low
  overhead.
- **Design tokens via Style Dictionary, authored in W3C DTCG format**
  (`$value` / `$type`), organized in three tiers — `global` (raw primitives)
  → `semantic` (role-based aliases, e.g. `color.action.primary.background.hover`)
  → `component` (`cdz-button`-scoped tokens that reference the semantic
  layer). Output target for this session is CSS custom properties only.
  DTCG is the format Spectrum, Polaris, and Lightning are all converging on,
  so tokens authored this way aren't locked to Style Dictionary specifically.
- **Components as framework-agnostic Web Components, built with Lit +
  TypeScript.** Consumers (Angular via `CUSTOM_ELEMENTS_SCHEMA`, the vanilla
  site, anything else later) all consume the same compiled custom element —
  there is no separate Angular wrapper to keep in sync.
- **Site as vanilla TypeScript + Vite**, importing the compiled component and
  its token CSS the same way any external consumer would. This is the
  dogfooding check: if the site can only consume the component through
  internal/monorepo-only shortcuts, the "framework-agnostic" claim is false.

## Options Considered

### Tokens: Style Dictionary vs. hand-written CSS custom properties

| Dimension | Style Dictionary | Hand-written CSS |
|---|---|---|
| Complexity | Medium (build step, config) | Low |
| Multi-platform output (iOS/Android/etc.) | Built-in, for free later | Would need to be built from scratch |
| Traceability (global → semantic → component) | Native via token references | Manual, easy to drift |
| Team familiarity (industry) | High — de facto standard | N/A |

**Style Dictionary wins** even though the skeleton only needs CSS today: the
three-tier reference model is the actual point of the case study, and adding
a second platform target later (e.g. JSON for a future native app) costs a
platform block, not a rewrite.

### Components: Lit Web Components vs. Angular components directly

| Dimension | Lit | Angular components |
|---|---|---|
| Framework reach | Any framework, or none | Angular only |
| Bundle/runtime overhead | ~5KB (Lit runtime) | Requires Angular runtime |
| "Portfolio proof" value | Demonstrates framework-agnostic architecture | Demonstrates Angular skill only |
| Team familiarity | New tooling (Lit, `@web/test-runner`) | Already deep Angular experience |

**Lit wins** for the explicit goal stated up front: "Angular los consume
nativo con `CUSTOM_ELEMENTS_SCHEMA`" implies the components must not *be*
Angular. The trade-off is accepting an unfamiliar toolchain (Lit,
`@web/test-runner`) instead of leaning on existing Angular depth.

### Monorepo tooling: pnpm vs. npm/Yarn workspaces

Not re-litigated here — pnpm was specified up front as the decided choice.
Noted only because it was confirmed compatible with the actual runtime
constraint below before being locked in.

## Trade-off Analysis

The common thread across all three decisions is **optionality over
convenience**: DTCG tokens outlive Style Dictionary, Lit components outlive
any one consuming framework, and a pnpm monorepo keeps three publishable
packages independently versionable without extra tooling (no Nx/Turborepo
needed at this scale). The cost is more moving parts for a one-component
skeleton than a single Angular app with SCSS variables would have had — a
cost accepted because the whole point of this session was validating that
architecture, not shipping the fastest possible button.

## Consequences

- **Easier:** adding component #2 is now "copy the button package's shape,"
  not "figure out the architecture." The token pipeline already proves out
  the global → semantic → component reference chain; new components add
  their own `component/*.tokens.json` file and reuse existing semantic
  tokens where possible.
- **Easier:** any future framework (Angular, React, plain HTML) consumes the
  same built artifact — no per-framework component maintenance.
- **Harder / to revisit:** the toolchain is pinned to older major versions
  because the development environment runs **Node 18.19.1**, and several
  tools have already moved their `engines.node` floor past it:
  `pnpm` 11.x → 9.15.9, `style-dictionary` 5.x → 4.4.0, `vite` 8.x → 6.4.x,
  `@web/test-runner` 1.0 → 0.20.2, and `@web/test-runner-playwright` 1.0
  (Node ≥22) was swapped for `@web/test-runner-chrome` 0.18.1 (Node ≥18),
  launched against the system-installed Chrome instead of a
  Playwright-managed browser binary. This needs revisiting the moment the
  environment moves to Node ≥20/22 — the newer majors are otherwise a
  straight upgrade, not a rewrite.
- **To revisit:** component token files reuse only a handful of global color
  primitives (2 blues, 2 grays, white) — enough for one button's accessible
  states, not yet a real palette. Scaling past Button will require growing
  the global tier deliberately instead of ad hoc.
- **To revisit:** the `site/src/pages` convention forced `vite.config.js`'s
  `root` to be `src` (not `src/pages`), which pushes built page URLs under a
  `/pages/` prefix (`dist/pages/index.html`). Fine for `pnpm dev`/`pnpm
  build` locally; whoever sets up hosting later needs to either serve
  `dist/` as-is (URLs live under `/pages/...`) or add a rewrite — this ADR
  intentionally leaves that choice open since hosting is out of scope this
  session.

## Action Items

1. [x] Monorepo scaffolded (`pnpm-workspace.yaml`, root `package.json`, `.gitignore`).
2. [x] `@cadenza/tokens` — Style Dictionary building DTCG tokens to CSS custom properties.
3. [x] `@cadenza/components` — `<cdz-button>` (Lit) with `aria-disabled`,
   `:focus-visible`, AA-contrast states, and passing `@web/test-runner` +
   axe-core accessibility tests.
4. [x] `@cadenza/site` — Vite site consuming the built component and tokens.
5. [x] Verified `pnpm build` runs tokens → components → site end to end, and
   `pnpm dev` renders the real, token-driven component in a browser.
6. [ ] When scaling past Button: decide whether every new component gets its
   own `component/*.tokens.json`, or whether some share a single file per
   category (e.g. all form controls).
7. [ ] Revisit pinned tool versions once the environment supports Node ≥20/22.
