# @kdenza/components

Accessible Web Components, built with [Lit](https://lit.dev) and driven by
[W3C DTCG](https://www.designtokens.org/) design tokens.

Framework-agnostic: they are custom elements, so they work the same in
React, Vue, Angular, Svelte or a plain HTML file.

**[Live component gallery →](https://kdenza.github.io/cadenza/design-system.html)**

## Install

```bash
npm install @kdenza/components
```

`@kdenza/tokens` comes with it as a dependency — you do not install it
separately unless you want the raw token files.

## Use

```js
// Registers all 22 custom elements as a side effect.
import '@kdenza/components';

// One stylesheet: the CSS custom properties every component reads.
import '@kdenza/components/dist/styles/tokens.css';
```

```html
<cdz-input label="Email" type="email" helper-text="We never share it."></cdz-input>
<cdz-button>Send</cdz-button>
```

Types are included. TypeScript also picks up the element tags:

```ts
import type { CdzInput } from '@kdenza/components';

const input = document.querySelector<CdzInput>('cdz-input');
```

### Without a bundler

`dist/styles/tokens.css` imports its four source files by package name, and
bare specifiers in CSS `@import` are resolved by bundlers, not by browsers.
With no build step, link the token files directly instead:

```html
<link rel="stylesheet" href="/node_modules/@kdenza/tokens/dist/css/tokens-light.css" />
<link rel="stylesheet" href="/node_modules/@kdenza/tokens/dist/css/tokens-dark.css"
      media="(prefers-color-scheme: dark)" />
```

See [@kdenza/tokens](https://www.npmjs.com/package/@kdenza/tokens) for the
manual light/dark override as well.

## What is in it

**Forms** — `cdz-input` · `cdz-textarea` · `cdz-checkbox` · `cdz-radio` ·
`cdz-radio-group` · `cdz-select` · `cdz-switch` · `cdz-range` ·
`cdz-file-input` · `cdz-button`

**Text and navigation** — `cdz-text` · `cdz-link` · `cdz-page-nav`

**Feedback** — `cdz-badge` · `cdz-spinner` · `cdz-progress` · `cdz-tooltip`

**Media and structure** — `cdz-icon` · `cdz-avatar` · `cdz-avatar-stack` ·
`cdz-divider`

**Primitive** — `cdz-popover` (ARIA-agnostic positioning, built on the
`popover` attribute and CSS Anchor Positioning)

A [custom elements manifest](https://custom-elements-manifest.open-wc.org/)
ships in the package as `custom-elements.json`, so editors can offer
per-element attribute completion.

## Accessibility

This is the point of the package, not a footnote.

- Every component's source documents **which ARIA pattern it implements and
  why** — the reasoning, not the behaviour.
- Native elements are preferred wherever they carry the semantics, so
  keyboard handling and screen reader output come from the platform rather
  than from re-implementation.
- The test suite runs [axe-core](https://github.com/dequelabs/axe-core)
  against every component in each of its states, in a real browser.
- Colour contrast is measured by reading values back from the browser, not
  computed on paper.
- Form components require a `label` and say so loudly in the console when
  one is missing.

## Theming

Light and dark are modelled in the tokens, not in the components. The
default follows the operating system with no JavaScript. To override it,
set `data-theme` on `<html>`:

```js
document.documentElement.setAttribute('data-theme', 'dark'); // or 'light'
```

Removing the attribute hands control back to the OS preference.

## Decisions

Every non-obvious choice in this package has a written record, including
the ones that turned out to be mistakes:
**[docs/decisions →](https://github.com/kdenza/cadenza/tree/main/docs/decisions)**

## Licence

MIT © Mónica Castillo
