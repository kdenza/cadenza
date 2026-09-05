# ADR-0026: English in the repository, Spanish on the site

**Status:** Accepted
**Date:** 2026-09-05
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

An audit of the twenty-five ADRs found the repository split cleanly down
the middle:

| | Language |
|---|---|
| ADR-0001 → 0015 | English |
| ADR-0016 → 0025 | Spanish |
| ADR-0013 | English body, Spanish amendment |

The same split runs through everything else: component JSDoc and commit
messages in English; README, CLAUDE.md, `docs/publishing.md`, the npm
package description, the components' own console errors and the site copy
in Spanish.

**None of this was decided.** It is drift with a precise cause. Partway
through the project the owner asked to be spoken to in neutral Spanish —
a preference about *conversation*. That preference was then applied to the
*artefacts* as well, which was never requested. The seam falls exactly at
ADR-0016, immediately after that exchange.

Worth naming plainly, because the failure is a general one: a stated
preference has a scope, and widening it silently is a way of deciding
something on someone's behalf while appearing to follow instructions.

## Decision

**Split by audience, not by language.**

- **The repository is in English.** ADRs, README, CLAUDE.md, publishing
  docs, roadmap, code comments, JSDoc, commit messages, and the runtime
  console messages that ship inside `@kdenza/components`.
- **The site stays in Spanish.** Page copy, component demos, and the case
  study.

The reasoning is that these are two different readerships. The repository
is consumed by whoever installs the package or reads the decisions — an
international, technical audience, reached through npm and a public
GitHub URL. The site is a portfolio: it speaks to whoever might hire its
author, and translating one's own narrative tends to flatten it.

### Why not a full bilingual set

`docs/en/` and `docs/es/` with all twenty-five ADRs in both was considered
and rejected. Complete translations of technical documentation rot: someone
corrects one language and the other silently starts lying, and
documentation that lies is worse than documentation that is missing. The
projects that sustain it have people dedicated to it.

The audience split gets most of the benefit for none of the recurring
cost.

### The runtime messages are part of the package, not of the docs

`warnIfLabelMissing` and the per-component errors in `cdz-icon`,
`cdz-link`, `cdz-tooltip` and `cdz-avatar` are developer-facing strings
shipped inside a published library. They follow the repository, not the
site — which means this change requires a `0.1.2` release rather than
being purely internal.

## Consequences

- **Easier:** anyone can read the reasoning behind the system. That
  reasoning is the actual product here; a reviewer who cannot read it gets
  a component library instead of a case study.
- **Cost paid once:** roughly two thousand lines of prose translated in a
  single pass, rather than a growing debt.
- **A rule to keep:** the language of an artefact is a property of its
  audience, and it does not change because the conversation around it
  changes.
- **To revisit:** the site is Spanish-only. If the portfolio ever targets
  international remote work, an English version of the case study is the
  one translation likely to be worth its maintenance — but only that page,
  not the docs.

## Action Items

1. [x] Audited every surface: twenty-five ADRs plus README, CLAUDE.md,
   publishing, roadmap, JSDoc, commit messages, npm metadata, console
   messages and site copy.
2. [ ] Translate ADR-0016 → 0025 and ADR-0013's amendment.
3. [ ] Translate README, CLAUDE.md, `docs/publishing.md`,
   `docs/roadmap.md`.
4. [ ] Translate the console messages and the npm `description`; release
   `@kdenza/components@0.1.2`.
