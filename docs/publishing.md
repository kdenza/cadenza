# Publishing and consuming the Cadenza packages

`@kdenza/tokens` and `@kdenza/components` are published to the **public
npm registry** (npmjs.com), under the `@kdenza` scope. `@kdenza/site` and
`@kdenza/gallery` are private — they are never published and exist only
inside this monorepo.

The reasoning for choosing the public registry over GitHub Packages is at
the end of this file, and in
[ADR-0006](decisions/0006-npm-github-packages.md)'s amendment.

## Before the first publish (once)

1. Have an account on [npmjs.com](https://www.npmjs.com/signup).
2. **Own the `@kdenza` scope.** On npm a scope belongs to a user or an
   organisation, and you can only publish under your own. Two routes:
   - the npm user is named `kdenza`, or
   - create a free organisation named `kdenza` (npmjs.com → *Add an
     Organization*; the free plan allows unlimited public packages).

   If `kdenza` is already taken on npm, you have to pick another scope and
   rename the packages — the same problem that already came up once with
   `cadenza` on GitHub (see ADR-0006).
3. Authenticate in the terminal:
   ```bash
   npm login
   ```

## Publishing a version

```bash
npm version patch -w @kdenza/tokens
```

`patch` for fixes, `minor` for compatible new API, `major` for breaking
changes — normal semver.

Note that with `-w` (workspace), `npm version` bumps `package.json` but
**deliberately skips** the git commit and tag it would create outside a
workspace. Commit the bump yourself.

```bash
npm publish -w @kdenza/tokens
```

`prepublishOnly` runs the build (and `analyze` for components) on its own,
so a stale or missing `dist/` can never be published.

Scoped packages publish as **private by default**, which fails without a
paid plan. That is why both carry `publishConfig.access: "public"` in
their `package.json`: without it you would need `npm publish
--access public` every time, and forgetting once is enough.

**Order between the two packages:** `@kdenza/components` depends on
`@kdenza/tokens`. If new versions of both are going out, publish tokens
first; and if components needs the new version, update that reference in
`packages/components/package.json` before publishing it.

```bash
npm publish -w @kdenza/components
```

To see exactly what would be uploaded, without uploading anything:

```bash
npm pack --dry-run -w @kdenza/components
```

### If publishing fails with a 404

A `404` on the `PUT` almost always means **"npm does not know who you
are"**, not "the package does not exist". The registry deliberately
returns 404 rather than 403 on writes so it does not leak who owns a
scope. The usual cause is an expired session; `npm login` again.

Note the asymmetry: a `GET` in the same state returns an honest `401`.
Only writes are obscured.

## Consuming from another project

No `.npmrc`, no token, no configuration:

```bash
npm install @kdenza/components
```

That brings `@kdenza/tokens` along as a transitive dependency. Then:

```js
import '@kdenza/components';
import '@kdenza/components/dist/styles/tokens.css';
```

```html
<cdz-button>Send</cdz-button>
```

In Angular you have to add `CUSTOM_ELEMENTS_SCHEMA` to the module or
component where any `cdz-*` is used, because Angular does not recognise
custom elements by default.

### A bundler is required

Vite, webpack, Rollup, Parcel — any of them will do, but **there has to be
one**. The package does not work dropped into an HTML file with a bare
`<script type="module">`, and it is worth saying plainly because for a Web
Components library that is a reasonable expectation this does not meet.

It breaks in two places, both because of *bare* specifiers, which a
browser does not resolve on its own:

- the JS does `import { LitElement } from 'lit'`;
- `dist/styles/tokens.css` does `@import '@kdenza/tokens/dist/css/...'`,
  which the browser interprets as a path relative to the CSS file itself,
  so it 404s.

Verified in the browser against the already-published package: without a
bundler no custom element registers and no token arrives. With Vite, all
seven components in the test register, the shadow DOM renders, and
`--color-page-background` arrives with its real value.

This is normal behaviour for a Lit library — Lit itself publishes bare
specifiers — but it remains **pending**: a self-contained build (with
`lit` included and CSS without external `@import`s) would allow CDN use
with no tooling. Nobody has asked for it yet, and it adds one more
artefact to maintain and version.

## Why the public registry and not GitHub Packages

It started on GitHub Packages (ADR-0006), on the argument that it kept the
packages under the same access control as the repository. The reason for
the change is concrete:

**GitHub Packages requires authentication to install, even for public
packages.** Anyone wanting to consume Cadenza would have to generate a
Personal Access Token and write an `.npmrc` before `npm install` would
work. For a company's internal distribution that is an acceptable trade;
for a design system that is also a portfolio's case study, it is exactly
the friction that defeats the purpose — nobody generates a token to look
at a demo.

The public registry has no such step. The cost is that the packages are
irreversibly public and need a real licence (MIT, see `LICENSE` at the
root), which was the right direction for this project anyway.

## Never paste a token into a chat

This applies to `npm login`, to any GitHub PAT, and to any other
credential: they belong in your own terminal, never in a conversation with
Claude and never committed to the repository. A token pasted into a chat
has to be considered compromised and rotated.
