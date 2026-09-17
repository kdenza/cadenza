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

## Amendment (2026-09-16): the published package was never covered

This ADR settled two audiences — the repository's (developers, English)
and the site's (its readers, Spanish) — and explicitly extended the first
to "the runtime console messages, which ship inside the published
package". It never addressed the other strings in that package: the
**user-facing** defaults `@kdenza/components` ships to public npm.

`cdz-spinner`'s `label`, `cdz-link`'s `newTabLabel`, `cdz-page-nav`'s
`toggleLabel` and `cdz-file-input`'s visible chrome are all Spanish. An
audit asked the obvious question — should they be English, for the wider
audience of a public package? — and the obvious question is the wrong one.

### The audience of a default string is one the package cannot know

Applying this ADR's own test rather than arguing about languages: the
audience for a component's user-facing string is *the end user of whatever
application consumes the package*. That person's language is not knowable
from inside the package. English is not more correct than Spanish for
someone reading a Japanese app; it is only more familiar to more
developers, which is a different audience from the one being served.

So the rule is not which language the default is written in. It is:

> **No user-facing string may be un-overridable.** The default's language
> is a convenience for the primary consumer — this project's site — and
> carries no claim to being right for anyone else. What has to be true is
> that every such string is a property a consumer can set.

That reframes the finding. Five of the six strings were already
properties, and `cdz-link`'s was already documented as "translatable".
Exactly one was not: `cdz-file-input`'s multi-file summary, hardcoded.
The defect was never the language — it was the one string that had no way
out. See ADR-0014's correction.

### Why the defaults are not being switched to English

Changing them would be a breaking change for every existing consumer, in
exchange for swapping one arbitrary default for another. The
overridability is what carries the guarantee; the default is a starting
value. A consumer serving any audience overrides it either way.

### Not enforced, and worth being honest about that

The other rules found in this audit became `pretest` guards, because each
was a property of source text a script can read. This one is not: "is this
string user-facing?" needs judgement a regex cannot supply, and a guard
that guesses would either miss the real cases or cry wolf on every literal
in a template. It stays a convention, which means it will be re-broken —
that is what conventions do here, and it is the reason the other three
became scripts.

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
