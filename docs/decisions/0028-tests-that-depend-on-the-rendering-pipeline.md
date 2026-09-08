# ADR-0028: Tests that depend on the rendering pipeline, and enforcing the rule in Node

**Status:** Accepted
**Date:** 2026-09-08
**Deciders:** Cadenza design system owner (UX Engineer)
**Related:** [ADR-0024](0024-ci-and-deploy.md), [ADR-0025](0025-hidden-attribute-and-host-display.md), [ADR-0027](0027-page-nav-first-molecule.md)

## Context

CI stayed red for four consecutive commits while every local run was
green. The site deployed four times over that red CI, because the deploy
does not depend on it — the situation ADR-0024 filed as "to revisit" and
knowingly accepted.

Two `cdz-icon` tests failed, both with `Timeout of 2000ms exceeded` and no
assertion error. A timeout with no assertion means the test never got to
run its body: it was waiting on something that never arrived.

The something was a frame.

`@open-wc`'s async `fixture()` awaits `elementUpdated`, which resolves
against `el.updateComplete` when the mounted element has one — a
microtask, always delivered — and otherwise falls back to `nextFrame()`,
which is `requestAnimationFrame`.

Both failing tests wrapped the component in a plain `<div>` to inherit a
colour or a font size:

```ts
const el = await fixture<HTMLElement>(
  html`<div style="color: rgb(0, 128, 0)"><cdz-icon name="check"></cdz-icon></div>`
);
```

A `<div>` has no `updateComplete`. So the await fell through to
`requestAnimationFrame` — and a headless runner under load does not
reliably service one, because nothing is compositing. On a developer
machine with a real compositor, frames arrive in milliseconds and the
tests always pass.

This is the same class of measurement error ADR-0019 tabulated and
ADR-0025 extended: the environment, not the code, decided the result. Here
it decided it in the *pleasant* direction locally, which is why it
survived to CI.

## Decision

### `fixtureSync` plus the component's own `updateComplete`

When a test needs a non-component root, mount it synchronously and await
the thing that actually has a completion signal:

```ts
const wrapper = fixtureSync<HTMLElement>(
  html`<div style="color: rgb(0, 128, 0)"><cdz-icon name="check"></cdz-icon></div>`
);
const el = wrapper.querySelector<CdzIcon>('cdz-icon')!;
await el.updateComplete;
```

This waits on Lit's render, which is a microtask chain and does not care
whether anything is painted. The wrapper needs no waiting — its style
attribute is set at parse time.

### The guard runs in Node, not in the browser

Four fixtures had this shape, not two: `icon` ×2 and `spinner` ×2. The
spinner pair passed that day by luck — same race, different outcome.

That is the argument against fixing them by hand. This is the third time
this project has fixed a known bug instance-by-instance and had it
reappear in a shape the manual pass did not cover (ADR-0025's `hidden`,
twice; now this). A hand fix only covers what someone happened to look at,
and my own first search for the pattern was too narrow and reported two
when there were four.

So the rule is enforced by
`packages/components/scripts/check-test-fixtures.mjs`, wired as `pretest`:
it scans every `*.test.ts` for `await fixture(` whose template opens on a
tag that is not a `cdz-*` element, and exits non-zero with file, line and
offending tag.

It runs in Node deliberately. The first attempt was a browser test using
`import.meta.glob` to read the sources — a Vite feature the esbuild-based
test runner does not implement. This is a rule about source text, and the
browser cannot read source text. Node can.

The guard was verified by planting two offending fixtures and confirming
it fails on both while ignoring a correct `<cdz-icon>` root. A guard that
has only ever passed has not been tested.

### A test file that fails to import is currently invisible

Worth recording, because it nearly hid the above: when the
`import.meta.glob` test module threw on import, the full suite reported
`265 passed, 0 failed` and said nothing. The file was skipped silently.
The only reason it was caught is that the expected count was 266.

A suite that can quietly shrink is a suite whose green is worth less than
it looks.

## Consequences

- **CI is green for the first time since `e807e8b`.**
- **Fixed:** two real failures, and two latent ones that had not failed
  yet.
- **The rule is now cheaper to follow than to break.** `npm test` fails
  before a single browser starts, locally and in CI, with the file and
  line.
- **Closes ADR-0024's first "to revisit" in the negative.** The risk was
  filed as theoretical and materialised within days: the site published
  four times from a tree whose tests did not pass. The mitigation chosen
  is not `workflow_run` chaining, which was rejected then and is still
  more trigger complexity than a single-maintainer repo needs — it is that
  the failure class which caused it is now caught before CI.
- **To revisit:** the suite does not fail when a test file cannot be
  imported. Until that is fixed, the test count is load-bearing and
  nobody is checking it.
- **To revisit:** `requestAnimationFrame` is not banned, only the implicit
  dependency on it. A test that genuinely needs a painted frame is still
  possible and would still be fragile in CI; none exist today.

## Action Items

1. [x] Converted the four rAF-dependent fixtures in `icon.test.ts` and
   `spinner.test.ts` to `fixtureSync` + `await el.updateComplete`.
2. [x] `scripts/check-test-fixtures.mjs`, wired as `pretest`, verified by
   planting offenders.
3. [x] Three consecutive full runs at 265/265 before pushing, to
   distinguish a fix from a lucky race.
4. [ ] Make the runner fail when a test module cannot be imported.
