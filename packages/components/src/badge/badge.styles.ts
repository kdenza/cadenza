import { css } from 'lit';

// Same static-fallback convention as every other component.
export const badgeStyles = css`
  :host {
    display: inline-flex;
    /* The variant's two colours are set once here and consumed below, so
       adding a variant is one block rather than three scattered rules. */
    --_bg: var(--cdz-badge-color-neutral-background, #e8dfe4);
    --_fg: var(--cdz-badge-color-neutral-foreground, #453a47);
  }

  /* Sin esto, el atributo hidden no hace nada en este componente: la regla
     [hidden] { display: none } del navegador es de origen UA, y el :host de
     arriba es de autor, así que gana el de autor y el elemento se sigue
     viendo. Es la contrapartida obligatoria de cualquier :host que fije
     display -- ver ADR-0025. */
  :host([hidden]) {
    display: none;
  }

  :host([variant='info']) {
    --_bg: var(--cdz-badge-color-info-background, #e4eaf7);
    --_fg: var(--cdz-badge-color-info-foreground, #2f4c87);
  }

  :host([variant='success']) {
    --_bg: var(--cdz-badge-color-success-background, #e6f0e8);
    --_fg: var(--cdz-badge-color-success-foreground, #2f6b41);
  }

  :host([variant='warning']) {
    --_bg: var(--cdz-badge-color-warning-background, #f7eddd);
    --_fg: var(--cdz-badge-color-warning-foreground, #7a5514);
  }

  :host([variant='error']) {
    --_bg: var(--cdz-badge-color-error-background, #f7e6e6);
    --_fg: var(--cdz-badge-color-error-foreground, #a73535);
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: var(--cdz-badge-spacing-gap, 0.25rem);
    padding-inline: var(--cdz-badge-spacing-padding-inline, 0.5rem);
    border-radius: var(--cdz-badge-radius, 0.375rem);
    background-color: var(--_bg);
    /* The border is the same colour as the text, not a third value: the
       tinted background sits very close to the page in lightness (about
       1.1:1), so without an outline the chip's edge is barely locatable.
       Text-coloured means it always clears 3:1 against the page, since
       that colour already had to clear 4.5:1 as text. */
    border: var(--cdz-badge-border-width, 1px) solid var(--_fg);
    color: var(--_fg);
    font-family: var(--cdz-badge-typography-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-badge-typography-font-size, 0.875rem);
    font-weight: var(--cdz-badge-typography-font-weight, 500);
    /* Keeps the pill compact and its height tied to the text, so a badge
       sitting inside a sentence doesn't push the line box around. */
    line-height: 1.4;
    white-space: nowrap;
  }

  /* currentColor is already the variant's foreground, so the icon needs
     no colour rule of its own -- the payoff of the SVG choice in
     ADR-0016. */
  cdz-icon {
    flex-shrink: 0;
  }
`;
