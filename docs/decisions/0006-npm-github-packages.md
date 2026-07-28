# ADR-0006: pnpm → npm, y publicar vía GitHub Packages

**Status:** Accepted — supersedes the pnpm portion of ADR-0001
**Date:** 2026-07-27
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

ADR-0001 chose pnpm workspaces for the monorepo, mainly for its strict
`node_modules` (no phantom dependencies) and its shared content-addressable
store. Revisited once the owner clarified two things that changed the
calculus:

- She's used npm exclusively in a corporate setting for years, but has
  never set up a package manager, a repo, or a publishing workflow for a
  project of her own — managing one familiar tool end-to-end (install →
  build → **publish** → consume) has real value here beyond the technical
  merits of either tool, since part of the point of this project is
  learning the full lifecycle firsthand.
- The actual goal driving this decision wasn't "which package manager is
  technically better" — it was **"I want `@cadenza/components` usable from
  my other projects, through the GitHub repo, and I want to understand
  both publishing and consuming."** That requirement (real registry,
  real semver versions) sits above the pnpm-vs-npm question and pointed at
  npm + a registry either way, since pnpm would need the exact same
  registry-publishing step regardless.

## Decision

### Package manager: npm workspaces

- `pnpm-workspace.yaml` replaced by a `"workspaces": ["packages/*"]` field
  in the root `package.json`.
- Every `"workspace:*"` version specifier became either a real semver range
  (`"@kdenza/tokens": "^0.1.0"` in `@kdenza/components` — a genuine
  cross-package dependency that also needs to resolve correctly for
  external consumers after publishing) or a plain `"*"` (in `@kdenza/site`
  and `@kdenza/gallery`, which are `private` and never published, so there
  is no external-resolution concern to satisfy).
- All `pnpm --filter X run Y` scripts became `npm run Y -w X`.
- `pnpm-lock.yaml` deleted, `package-lock.json` generated in its place —
  the two lockfile formats solve the same problem but aren't convertible.
- `.claude/launch.json` updated: npm hoists shared devDependency binaries
  to the workspace **root** `node_modules/.bin`, unlike pnpm which keeps a
  `.bin/vite` inside each package — the dev-server launch commands now
  resolve `../../node_modules/.bin/vite` relative to each package instead
  of a local one.
- npm 11 introduced a script-allowlist security feature
  (`npm approve-scripts`) that blocks `postinstall` scripts (esbuild's
  native binary fetch, style-dictionary's `patch-package` step) until
  explicitly approved. Approved once via `npm approve-scripts --all`,
  which persists the allowlist as an `allowScripts` field in the root
  `package.json` — committed, so this doesn't need re-approving by anyone
  who clones the repo fresh.
- Verified: full `npm run build` and `npm test` (28/28) pass identically
  to the pnpm baseline, and both dev servers (site, gallery) still start
  correctly.

### Distribution: GitHub Packages, scope `@kdenza`

GitHub Packages requires an npm package's scope to match its GitHub owner.
The plan was to create a free `cadenza` GitHub organization and transfer
the repo into it, keeping the existing `@cadenza/*` package names — but
`cadenza` was already taken as a GitHub account name by the time the owner
went to create it. Rather than fall back to renaming everything to
`@moni-kyrah/*` (which would have detached the package scope from the
project's own name for no real benefit), the owner proposed **`kdenza`** —
a portmanteau of "Kyrah" + "Cadenza." Verified available both as a GitHub
account name and as an unclaimed scope on the public npm registry before
committing to it, specifically to avoid a second round of this same
rework. The org was created and the repo transferred to
`github.com/kdenza/cadenza`.

This changed every package name in the monorepo from `@cadenza/*` to
`@kdenza/*` — a real, if mechanical, rename touching every `package.json`,
every import statement, `.npmrc`, and the `repository.url` field in both
publishable packages. Deliberately **not** touching the historical
mentions of `@cadenza/*` inside ADR-0001 through ADR-0005: those documents
are a record of what was true when they were written (the same reasoning
already applied to leaving `pnpm` untouched in ADR-0001 itself). This ADR,
by contrast, was still being drafted when the rename happened, so its own
examples reflect the final `@kdenza` outcome directly rather than a
now-inaccurate first draft.

Project name, branding, and the `cdz-` custom element prefix are
unaffected — none of those are tied to the npm scope or the GitHub
account name.

- `@kdenza/tokens` and `@kdenza/components` (the two packages meant to be
  consumed elsewhere): `"private": true` removed, bumped from the
  placeholder `0.0.0` to a real first version `0.1.0`, and given
  `publishConfig.registry` pointing at `https://npm.pkg.github.com`.
- `@kdenza/site` and `@kdenza/gallery` stay `private: true` — nothing
  outside this repo should ever depend on either.
- Root `.npmrc` maps the `@kdenza` scope to GitHub Packages and reads the
  publish token from a `NODE_AUTH_TOKEN` environment variable — never a
  literal secret in a committed file, and never something typed into a
  Claude Code conversation. Same expectation for consuming projects (their
  own `.npmrc`, their own token with `read:packages`).
- `custom-elements.json` — normally `.gitignore`'d as a generated artifact
  (same as `dist/`) — is deliberately listed in `@kdenza/components`'
  `"files"` array so it ships inside the **published npm tarball**, even
  though it's absent from **git**. Verified with `npm pack --dry-run` that
  an explicit `files` entry is included in the tarball regardless of
  `.gitignore`, which only governs what git tracks, not what npm packs.
- Both publishable packages get a `prepublishOnly` script
  (`npm run build [&& npm run analyze]`) so `npm publish` can never ship a
  stale or missing `dist/`.
- License field set to `"UNLICENSED"` rather than guessing a real license —
  the repo is still private and no license terms have been decided; this
  is the correct signal for "not licensed for reuse yet," not a permanent
  choice.

## Consequences

- **Easier:** any other personal project can now depend on
  `@kdenza/components` the same way it would depend on any real npm
  package — `npm install @kdenza/components`, real version pinning, no
  git access to this repo required for a consumer that only needs the
  built package.
- **Easier:** publishing is a two-command lifecycle
  (`npm version <bump> -w ...` + `npm publish -w ...`) with the build step
  guaranteed via `prepublishOnly` — no separate manual "did I remember to
  build first" step to forget.
- **To revisit:** publishing is entirely manual right now (no GitHub
  Actions workflow triggers it on tag push). Deliberately out of scope —
  CI/CD was explicitly deferred back in ADR-0001's session — but worth
  automating once publishing happens often enough that doing it by hand
  gets old.
- **To revisit:** `npm audit` flags two real advisories in current
  dependencies — a `brace-expansion` DoS (transitive via
  style-dictionary's bundled `glob`, fixed only by the style-dictionary
  5.x upgrade already deferred) and an esbuild dev-server file-read issue
  scoped to Windows (irrelevant to this Linux dev environment, but worth
  clearing whenever the deferred tool-version upgrade pass happens).

## Action Items

1. [x] Root workspace config, scripts, lockfile migrated to npm; verified
   build/test/dev-server parity with the pnpm baseline.
2. [x] `@kdenza/tokens` and `@kdenza/components` prepared for publishing:
   version `0.1.0`, `publishConfig`, `prepublishOnly`, verified tarball
   contents via `npm pack --dry-run`.
3. [x] `.npmrc` (registry scope + token env var), `docs/publishing.md`
   (publish steps + consumption steps for external projects).
4. [x] Owner created the `kdenza` GitHub organization (`cadenza` was
   already taken) and transferred the repo — now
   `github.com/kdenza/cadenza`. Every `@cadenza/*` reference in active
   code/config renamed to `@kdenza/*` to match.
5. [ ] First real `npm publish` of both packages, once a
   `write:packages`-scoped token exists.
