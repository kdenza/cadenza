# ADR-0024: CI on GitHub Actions and deployment to GitHub Pages

**Status:** Accepted
**Date:** 2026-08-20
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Until now, the 234 tests and `npm audit` ran **when someone remembered**.
ADR-0023 records the exact price of that: dependency debt grew from 2 to 9
advisories over three weeks unnoticed, and its own "to revisit" note
pointed out that nothing stopped it happening again.

In parallel, the system had two packages published on npm and **zero
public URLs**. A design system you can only see by cloning the repository
is neither consumable nor demonstrable.

## Decision

### CI: build, tests and audit on every push and PR

A single job on `ubuntu-latest`, Node 24 (the same as the development
environment). The step that justifies the workflow is neither the build
nor the tests, but `npm audit --audit-level=high`: it is what turns "debt
that ages silently" into "a red build the day it appears".

**Chrome is located, not hard-coded.** `@web/test-runner` needs a binary;
`ubuntu-latest` ships one, but a preceding step searches four possible
names and fails with `::error::` if none is found. If a future image moves
it, the failure is explicit there rather than an error without context
inside the test runner.

Everything verifiable without a runner was verified locally: valid YAML,
`npm ci` from a deleted `node_modules`, build, tests with `CHROME_PATH`
pointing at the system Chrome, and `npm audit --audit-level=high` exiting
0.

That also cleared a scare: `npm ci` warns that esbuild's postinstall is
deferred by npm 11's `allow-scripts` policy. It turns out to be harmless —
the binary comes from the optional `@esbuild/linux-x64` package, not from
the script. Confirmed by deleting `node_modules` entirely rather than by
reasoning about it.

### Deployment: GitHub Pages

Free, already lives where the repository lives, and adds no further
account to maintain. Only `packages/site/dist` is published;
`@kdenza/gallery` stays private and undeployed (ADR-0004).

### What the deploy exposed

This is the part worth keeping. Preparing the deploy found **three things
that were broken and never failed locally**:

1. **The site's 7 ADR links were already broken.** They pointed at
   `../../../docs/decisions/*.md`, which escapes the Vite root; they 404'd
   *in development too*. Nobody noticed because nobody had clicked them.
   They now point at GitHub URLs, which work in both places, and use
   `target="_blank"` — the `rel="noopener"` and accessible notice
   `cdz-link` already carried for this (ADR-0015).

2. **`dist/index.html` did not exist.** The pages lived in `src/pages/`,
   so the build emitted `dist/pages/index.html` and any static host's root
   URL would have 404'd. **ADR-0001 predicted this in as many words** and
   left the decision open "since hosting is out of scope". Resolved by
   flattening the pages into `src/` rather than adding a rewrite: the
   `/pages/` prefix bought nothing and cost a redirect on every target.

3. **The broken-image demo requested `/no-existe.png` absolutely**, which
   on Pages would have escaped the project to the domain root. It still
   404s — that is the demo's point — but now within its own space.

### Conditional `base`, not fixed

GitHub Pages serves a project site from `/<repo>/`. A bare
`base: '/cadenza/'` would break the dev server, which serves from `/`. It
is conditioned on `NODE_ENV === 'production'`, and the workflow sets it
explicitly.

Verified by **serving the build under the subpath**, not merely compiling
it: a static server with `cadenza/` pointing at `dist/` reproduces Pages'
exact shape. Both pages, the assets and the internal links resolve; zero
console errors. Compiling without errors would have proved none of that.

## Consequences

- **Easier:** there is a URL to put on a CV, and every push updates it.
- **New:** a red build now blocks the view that something is wrong instead
  of letting it pass. That is the point.
- **To revisit:** the deploy runs on the same push as CI but does not
  *depend* on it — Pages and CI are separate workflows. If the tests fail,
  the site publishes anyway. Chaining them requires `workflow_run`, which
  complicates the trigger; left as is knowingly while the repository has a
  single maintainer.
- **To revisit:** the gallery is still not deployed. It is the viewer with
  the live accessibility audit — precisely what best demonstrates the
  method — but it is a private package with its own server. Publishing it
  is a separate decision.

## Action Items

1. [x] `.github/workflows/ci.yml`: build + 234 tests + `npm audit
   --audit-level=high`, with defensive Chrome discovery. Verified from a
   deleted `node_modules`.
2. [x] Rewrote the 7 ADR links, broken beforehand, to GitHub URLs with
   `target="_blank"`.
3. [x] Flattened the pages from `src/pages/` to `src/`; closed ADR-0001's
   "to revisit" note.
4. [x] Conditional `base` in `vite.config.ts`, verified by serving the
   build under `/cadenza/` in a real browser.
5. [x] `.github/workflows/deploy.yml` with Pages' minimum permissions and
   `concurrency` without cancellation, so a deploy is never left half-done.
