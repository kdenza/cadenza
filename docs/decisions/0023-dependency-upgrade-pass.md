# ADR-0023: Upgrade every tool and clear all 9 advisories

**Status:** Accepted
**Date:** 2026-08-20
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

ADR-0006 deliberately pinned tooling **below its latest major**, to avoid
re-verifying the whole pipeline in the same session Node had been
upgraded. It recorded that `npm audit` flagged "2 real advisories tied to
this".

On picking it back up, there were **9** (8 high, 1 low). That is the
finding that matters more than any version number: dependency debt does
not sit still, and the note documenting it aged silently for three weeks
while twelve atoms were built on top of it.

The timing was chosen on purpose: **before** writing the portfolio's case
study. Upgrading afterwards would have mixed every regression with new
content, and separating those two causes costs far more than doing this
with the system stable and green.

## Decision

Upgrade everything, one at a time, verifying build plus the 234 tests
between each step, and comparing generated artefacts against a baseline
rather than trusting that it "compiles".

| Package | From | To | Why |
|---|---|---|---|
| style-dictionary | 4.4.0 | 5.5.2 | **Prototype pollution** (high) in `convertTokenData` |
| `@web/test-runner` | 0.20.2 | 1.0.0 | Root of 5 chained advisories |
| `@web/test-runner-chrome` | 0.18.1 | 1.0.1 | same (puppeteer-core → @puppeteer/browsers → extract-zip) |
| `@web/dev-server-esbuild` | 1.0.5 | 2.0.0 | goes with the runner |
| vite | 6.4.3 | 8.2.2 | two majors behind |
| TypeScript | 5.9.3 | 7.0.2 | new compiler |
| axe-core | 4.12.1 | 4.13.0 | minor |

Result: **0 vulnerabilities**, 234/234, and the suite got faster, from
~3.9s to ~2.8s.

### Compare artefacts, don't trust that it compiles

Two major bumps touched code generation, so for both a baseline was
captured beforehand and compared byte for byte after:

- **style-dictionary 5.x**: all four theme CSS files came out
  **identical**, with the config untouched. The major bump broke nothing
  this project uses.
- **TypeScript 7**: all 41 emitted `.js` files came out **identical** to
  5.9's. This was the only genuinely frightening part of the jump: Lit's
  no-decorators pattern depends on `useDefineForClassFields: false` so
  fields emit as constructor assignments rather than
  `Object.defineProperty`, which would shadow Lit's accessors and break
  reactivity **silently**. An identical diff proves that did not change;
  "compiled without errors" would not have.

### Vite 8 stopped being hoisted

A real side effect: with vite 8, npm no longer hoists it to the workspace
root, so `node_modules/.bin/vite` disappeared and anything pointing there
broke (here, the dev servers' launch configuration). Corrected to
`packages/<pkg>/node_modules/.bin/vite`.

It is the kind of breakage a green `npm run build` never catches, because
it only affects development startup.

## Consequences

- **Easier:** the "versions pinned on purpose" note disappears. There is
  no longer anything to explain about the project lagging behind.
- **New risk taken on:** TypeScript 7 is very recent. The mitigation is
  not hope, it is the byte-for-byte diff: if a future version changes
  emission, comparing against the baseline catches it. Worth repeating
  that check at the next TS jump.
- **To revisit:** nothing prevents this ageing another three weeks. An
  `npm audit` in CI would surface it the day it appears rather than the
  day someone remembers to look — but CI does not exist yet.

## Action Items

1. [x] Non-major `npm audit fix` (brace-expansion, nanoid, esbuild) and
   axe-core 4.13; 9 → 7 advisories, token CSS identical.
2. [x] style-dictionary 5.5.2; closes the prototype pollution, output
   identical byte for byte, 9 → 6.
3. [x] `@web/test-runner` chain to 1.x; **0 advisories**. Runner stability
   verified across 6 runs chained after a build.
4. [x] vite 8.2.2 verified in-browser (10/10 custom elements, tokens
   live), and the binary path corrected in the launch configuration.
5. [x] TypeScript 7.0.2 across all three packages, with all 41 `.js`
   compared against the 5.9 baseline.
6. [x] Updated CLAUDE.md's "environment constraints" section, which still
   described July's state.
