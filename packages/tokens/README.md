# @kdenza/tokens

Design tokens for the Cadenza design system, authored in the
[W3C DTCG](https://www.designtokens.org/) format and compiled to CSS custom
properties by [Style Dictionary](https://styledictionary.com/).

**[See them applied →](https://kdenza.github.io/cadenza/design-system.html)**

## Install

```bash
npm install @kdenza/tokens
```

If you are using [@kdenza/components](https://www.npmjs.com/package/@kdenza/components),
this package already comes with it.

## Use

```css
@import '@kdenza/tokens/dist/css/tokens-light.css';
@import '@kdenza/tokens/dist/css/tokens-dark.css' (prefers-color-scheme: dark);
```

Both files declare the same custom property names on `:root`. The dark one
loads second, so on a dark-mode system it wins through the cascade — no
JavaScript, no class toggling.

```css
.card {
  background: var(--color-surface-hover);
  color: var(--color-text-body);
  border-radius: var(--radius-3);
}
```

### Manual override

To let a user choose a theme regardless of their OS setting, also load the
two `-forced` files:

```css
@import '@kdenza/tokens/dist/css/tokens-dark-forced.css';
@import '@kdenza/tokens/dist/css/tokens-light-forced.css';
```

They use a `[data-theme="..."]` selector instead of `:root`, which has
higher specificity than a plain `:root` — even one inside a media query —
so setting the attribute wins:

```js
document.documentElement.setAttribute('data-theme', 'dark');
```

Loading them unconditionally is safe: with no `data-theme` present, neither
selector matches anything.

## The four files

| File | Selector | What it is for |
|---|---|---|
| `tokens-light.css` | `:root` | The base. Always load it. |
| `tokens-dark.css` | `:root` | Load behind `(prefers-color-scheme: dark)`. |
| `tokens-dark-forced.css` | `[data-theme="dark"]` | Optional, for a manual toggle. |
| `tokens-light-forced.css` | `[data-theme="light"]` | Optional, for a manual toggle. |

## Three tiers

Tokens are organised in layers, and a layer never skips the one below it:

1. **Global** — raw primitives. `--color-lilac-700`, `--spacing-4`. Named
   for what they are.
2. **Semantic** — roles. `--color-action-primary-background-default`,
   `--color-form-border-error`. Named for what they mean. **This is the
   tier to consume**, and the only one that forks between light and dark.
3. **Component** — per component. `--cdz-button-color-background-default`.
   Named for where it is used, and always a reference into the semantic
   tier.

Consuming a semantic role rather than a primitive is what makes dark mode
work for free: the role points at a different primitive per mode, and
nothing downstream changes.

## Decisions

Why this palette, why three tiers, and how contrast was verified:
**[docs/decisions →](https://github.com/kdenza/cadenza/tree/main/docs/decisions)**

## Licence

MIT © Mónica Castillo
