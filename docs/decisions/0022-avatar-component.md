# ADR-0022: `<cdz-avatar>` — when the correct default is the loud one

**Status:** Accepted
**Date:** 2026-08-06
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Last atom on the roadmap. It brings three decisions unlike any other
component's: it deliberately breaks the accessibility rule the previous
three had been sharing, rejects a very common industry pattern for a
measurable reason, and is the first that has to treat text as genuine
Unicode.

## Decision

### Three ways to render, and the last two are siblings

Photo (`src`) → initials (from `name`) → generic person icon. Which of the
last two is used is `fallback`'s choice, and **neither is a degraded
version of the other**: initials say *which* person, the icon says *a*
person. The second case is real and frequent — a placeholder row, an
account with no name yet, a deliberately anonymous entry — and forcing
initials there invents an identity that does not exist.

If initials are asked for and the name yields none, it falls through to
the icon. The worst possible case is still a person-shaped mark, never an
empty circle.

### Meaningful by default — the opposite of `cdz-icon` and `cdz-divider`

ADR-0021 stated the shared rule as *"the default is the quieter option"*.
This component breaks it, and what is worth keeping is the refinement, not
the exception:

- `cdz-icon` **cannot** default to meaningful, because it has no correct
  string to do it with. It would have to invent one from the icon's
  `name`, and "alert-triangle" read aloud is worse than silence.
- This component **already requires `name`** — the initials come from it —
  so the loud option is not a guess. It is the person's actual name,
  already present.

The failure modes are asymmetric in exactly the direction that settles the
tie. An avatar announced too much repeats a name that was already on
screen: verbose, no violation. An avatar too silent, used as the only
identifier in an avatar stack or an account button, is unidentifiable: a
1.1.1 failure.

**The rule, corrected:** the default is quiet when the loud option would
have to be guessed; it is loud when the correct string is already in hand.

`decorative` turns the announcement off for the common case of having the
name written next to it ("Kyrah Monreal commented 2 hours ago").

The initials and the icon are never announced, in either mode: "KM" is not
a name, and under `role="img"` the descendants are presentational anyway.

### `name` required, but only when it is genuinely used

A decorative avatar that also falls back to the icon genuinely has nothing
to say, so warning there would be a false positive. And a warning that
cries wolf gets filtered out, which costs more than the check is worth.
That is why this component does **not** use the shared
`warnIfLabelMissing`: that helper's message is about form fields, and the
condition here is not unconditional.

### No colour derived from the name

Hashing a name to a hue is the industry's most common trick for this piece,
and it is a contrast trap: **every** generated colour would have to clear
4.5:1 against the initials in light *and* dark, and a hash cannot promise
that. This project's methodology is to verify each pair in the browser; an
infinite colour space cannot be verified.

A single pair from the status palette (`color.status.neutral`, ADR-0017),
already verified. Measured again here across all three sizes: **8.26:1 in
light and 6.37:1 in dark**. It is the second time that palette has been
reused outside `cdz-badge`, which is exactly what it was created for.

### Initials: grapheme clusters, and normalised output

First component to treat text as Unicode rather than as a string of
characters. Two things measured in the browser, not assumed:

| Name | `Array.from(w)[0]` | `Intl.Segmenter` |
|---|---|---|
| "ñora garcía" (decomposed ñ) | **N** — loses the tilde | **Ñ** |
| "क्षमा शर्मा" | **क** — a different letter | **क्ष** |

`Intl.Segmenter` is the only thing that gets both right. An `Array.from`
fallback is kept because without it the failure would be a wrong initial
rather than an error, and that is exactly the kind of thing that should
degrade quietly.

The output is normalised to **NFC**, so the same name produces the same
string whichever encoding it arrived in. Found by a test failing with
`expected 'ÑG' to equal 'ÑG'` — identical on screen, different in bytes.
This component's tests write those cases with `\u` escapes rather than
literal characters: a literal there only tests whatever the editor decided
to save.

It takes the first and last word, so particles are skipped for free ("Ana
de la Cruz" → "AC") without maintaining a per-language list.

### The photo goes on top of the fallback, not in its place

The fallback is always mounted; the image is drawn over it. That way there
is something to look at while loading and nothing shifts when it arrives.
`object-fit: cover` crops to the circle rather than stretching, and
`flex: 0 0 auto` stops a long name beside it from squashing it into an
ellipse (with a test).

**Measured trap:** assigning `src=""` to an `<img>` fires `error`, not
silence. That is why "no photo" and "broken photo" are separate paths in
the code — with an empty `src` the `<img>` is never rendered, instead of
rendering it and handling its error. And a new `src` resets the failure
state, so one broken photo does not poison the next.

The tests trigger the failure with a data URI that claims to be a PNG and
is not, rather than with a URL that 404s: the 404 settles in ~4.8ms
against ~0.3ms for the data URI, and only the first depends on a server.
The component cannot tell the two cases apart anyway — all it sees is
`error`.

### The intermittent test, and why the first hypothesis was wrong

Worth telling in full because the methodological error is more useful than
the fix.

The suite began failing intermittently — 3 to 5 tests, only when chained
after a build — and in the first episode the failure detail was lost by
filtering the output. Without knowing **which** tests they were, the most
obvious-looking source of fragility was changed (the network 404) and the
suite passed 8 runs in a row. It looked resolved. It was not: it failed
again as soon as it was chained with a build.

With the whole log saved, the culprit turned out to be **a single test**,
for a reason no amount of retrying would have revealed:

`@open-wc`'s `fixture()` awaits `elementUpdated`, which uses
`el.updateComplete` **if it exists** — a microtask — and otherwise falls
back to `nextFrame()`, i.e. `requestAnimationFrame`. A plain `<div>` has
no `updateComplete`. And this was the **only test of the 234** mounting a
plain element as its root, so it was the only one whose result depended on
the browser choosing to paint; under load, rAF exceeded mocha's 2s while
the rest of the suite flew through microtasks.

`fixtureSync` plus awaiting the avatar's own `updateComplete` removes the
dependency without weakening the test: `getBoundingClientRect` forces
layout synchronously, so a frame was never needed. 12 runs chained with a
build, 0 failures.

Two lessons, and the second is the expensive one:

1. **An intermittent test that passes after a change is not a fixed test.**
   It is the classic trap: the evidence of "it passed 8 times" was equally
   consistent with having fixed it and with never having touched it.
2. **Never filter the output of a failure you do not understand.** The
   first episode could have been diagnosed as fast as the second; all that
   was missing was having saved the log.

### A new icon: `user`

Head and shoulders as two separate strokes rather than a silhouette: at
24px the outline of a bust turns into a blob, whereas two marks with a gap
between them still read as a figure.

Stroked extent 3→21 horizontally, 2→22 vertically: the full height of the
live area, but 18 wide instead of 20. The asymmetry is deliberate — a
person reads taller than wide, and pushing the shoulders out to 20 would
make this the heaviest icon in the set. Audited at 96px alongside `info`
and `check`.

**Fourth false negative from a measurement tool** (the table lives in
ADR-0019): `getBBox({ stroke: true })` **accepts the option and ignores
it** in Chromium 148. No throw, no warning — it simply returns the
geometric box. Confirmed with the decisive case: a straight line with a
2-unit stroke still reports zero height. The extent was computed by hand.

## Consequences

- **Harder:** the system's accessibility rule no longer fits in one
  sentence. A new component has to ask whether the correct string exists
  before choosing a default, rather than copying its neighbour. It is more
  work and it is the right work.
- **Known limit:** the initials at `sm` measure 9.6px. Contrast passes
  comfortably (8.26:1), but 9.6px is small for reading two letters. For
  `sm` avatars the icon fallback probably reads better; it is not forced
  because changing the fallback based on size would be surprising
  behaviour.
- **To revisit:** no square variant. It is a real distinction in other
  systems (round for people, square for organisations) and would add API
  nobody has asked for yet.
- **To revisit:** no avatar stack (`+3`). That is a molecule: it
  coordinates several avatars and needs its own group semantics, same as
  `cdz-radio-group`.
- **Platform note:** TypeScript's `lib` was raised to include `ES2022.Intl`
  purely for `Intl.Segmenter`'s types. The `target` stays at ES2021 — it
  changes what TS knows about, not what it emits.

## Action Items

1. [x] Measured in-browser that `src=""` fires `error`, and compared the
   two grapheme-splitting strategies before writing the component.
2. [x] `component/avatar.tokens.json` — sizes, the colour pair reused from
   the status palette, and two unitless scales.
3. [x] `user` icon in the registry, with the extent computed by hand and
   audited at 96px.
4. [x] `<cdz-avatar>` with all three states, `decorative`, and the
   conditional `name` warning.
5. [x] Tests: initials derivation (combining marks, clusters, astral
   plane, whitespace, normalisation), fallback on a broken photo, reset on
   `src` change, empty `src`, both accessible-name modes, hot switching,
   circularity under flex pressure, and accessibility across all five
   combinations — 234/234.
6. [x] Dogfooded on the site and in the gallery; contrast read back from
   the browser in both modes; axe with no violations.
