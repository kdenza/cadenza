# Guard fixtures

Inputs for `scripts/check-guards.mjs`, which tests the four `pretest`
guards. Each directory below stands in for a `src/` tree; the guards take
the root from `CDZ_GUARD_ROOT`.

## Almost all of these actually shipped broken

A hand-written fixture can be wrong in the same way a hand-verification
can — it encodes what someone *believed* the defect looked like. A source
that really shipped cannot. So these were lifted out of git history rather
than written:

| fixture | taken from | the defect |
|---|---|---|
| `test-fixtures/fail/icon.test.ts` | `5b53ad2^` | `await fixture()` on a `<div>` root — the rAF dependency that kept CI red for four commits (ADR-0028) |
| `hidden-coverage/fail/` | `main` (`8818c4a`) | `cdz-popover` defined but absent from `TAGS`; the coverage list and the popover source, both verbatim |
| `lifecycle/fail-reconnect/page-nav.ts` | `main` | observer disconnected on unmount, never rebuilt (ADR-0031) |
| `lifecycle/fail-listener/select.ts` | `main` | `toggle` listener removed on unmount, never re-added |
| `lifecycle/fail-slotchange/tooltip.ts` | `main` | slotted children read once, no `@slotchange` |
| `state-attribute/fail/avatar.ts` | `main` | `state: true` without `attribute: false`, so `_imageFailed` shipped as public API |

The `pass/` counterpart of each is the same file at this branch's `HEAD`,
after the fix. That pairing is the point: the guard has to separate these
two versions of one file, which is exactly what it claims to do.

## The one that is hand-written

`lifecycle/fail-delegated/delegated.ts` has no historical original. The
shape was planted during review, to show that moving a release one
function call away made all three lifecycle rules go blind — the guard
printed a tick and exited 0 on a component with its precise target defect.
It is kept because the refactor that produces it is ordinary, and
`cdz-tooltip` already delegates part of its teardown to `_clearTimers()`.

Its file comment says all of this too, so nobody has to find this README
to know it is the odd one out.

## Adding a rule

1. Put a `pass/` and a `fail/` tree here.
2. Add its marker to `RULES` in `check-guards.mjs` and a case to `CASES`.

Step 2 is not optional: the runner fails on any fixture directory no case
claims, so a fixture cannot sit here looking like coverage it does not
provide.

## On the count

The review that asked for this said "7 rules across the four guards"; its
own table listed 1 + 1 + 3 + 1, and my reply repeated the 7 without adding
it up. There are **6**. `check-guards.mjs` now derives that number from
`RULES` rather than stating it, which is the only way a count in a
document stays true — and the reason is the same one ADR-0031's own
miscount demonstrated on the branch that introduced these guards.
