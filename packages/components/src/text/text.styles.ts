import { css } from 'lit';

export const textStyles = css`
  :host {
    display: block;
  }

  /* Sin esto, el atributo hidden no hace nada en este componente: la regla
     [hidden] { display: none } del navegador es de origen UA, y el :host de
     arriba es de autor, así que gana el de autor y el elemento se sigue
     viendo. Es la contrapartida obligatoria de cualquier :host que fije
     display -- ver ADR-0025. */
  :host([hidden]) {
    display: none;
  }


  /* Resets the browser's built-in h1-h6/p margins — layout spacing in
     Cadenza comes from the consumer's own gap/margin utilities, not
     implicit per-element defaults that differ across tags. */
  .text {
    margin: 0;
    color: var(--cdz-text-color-default, #2c2230);
  }

  .size-heading-1 {
    font-family: var(--cdz-text-heading-1-font-family, 'Figtree', system-ui, sans-serif);
    font-size: var(--cdz-text-heading-1-font-size, 2rem);
    font-weight: var(--cdz-text-heading-1-font-weight, 600);
  }

  .size-heading-2 {
    font-family: var(--cdz-text-heading-2-font-family, 'Figtree', system-ui, sans-serif);
    font-size: var(--cdz-text-heading-2-font-size, 1.5rem);
    font-weight: var(--cdz-text-heading-2-font-weight, 600);
  }

  .size-heading-3 {
    font-family: var(--cdz-text-heading-3-font-family, 'Figtree', system-ui, sans-serif);
    font-size: var(--cdz-text-heading-3-font-size, 1.25rem);
    font-weight: var(--cdz-text-heading-3-font-weight, 600);
  }

  .size-body-lg {
    font-family: var(--cdz-text-body-lg-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-text-body-lg-font-size, 1.25rem);
    font-weight: var(--cdz-text-body-lg-font-weight, 400);
  }

  .size-body-md {
    font-family: var(--cdz-text-body-md-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-text-body-md-font-size, 1rem);
    font-weight: var(--cdz-text-body-md-font-weight, 400);
  }

  .size-body-sm {
    font-family: var(--cdz-text-body-sm-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-text-body-sm-font-size, 0.875rem);
    font-weight: var(--cdz-text-body-sm-font-weight, 400);
  }
`;
