import { css } from 'lit';

// Same static-fallback convention as cdz-button/cdz-input/cdz-checkbox.
export const radioStyles = css`
  :host {
    display: inline-block;
  }

  /* Sin esto, el atributo hidden no hace nada en este componente: la regla
     [hidden] { display: none } del navegador es de origen UA, y el :host de
     arriba es de autor, así que gana el de autor y el elemento se sigue
     viendo. Es la contrapartida obligatoria de cualquier :host que fije
     display -- ver ADR-0025. */
  :host([hidden]) {
    display: none;
  }


  .field {
    display: flex;
    flex-direction: column;
    gap: var(--cdz-radio-spacing-gap, 0.5rem);
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--cdz-radio-spacing-gap, 0.5rem);
  }

  .control-wrapper {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    width: var(--cdz-radio-size, 1rem);
    height: var(--cdz-radio-size, 1rem);
  }

  /* Circular shape is a fixed convention for radio buttons, not driven by
     the shared corner-radius token — border-radius: 50% is hardcoded on
     purpose here, unlike cdz-button/cdz-input which reference
     --cdz-*-radius. */
  input.circle {
    appearance: none;
    margin: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border-radius: 50%;
    border: var(--cdz-radio-border-width, 1px) solid var(--cdz-radio-color-border-default, #8a7c87);
    background: transparent;
    cursor: pointer;
  }

  input.circle:checked {
    border-color: var(--cdz-radio-color-border-checked, #7a5197);
  }

  input.circle[aria-invalid='true'] {
    border-color: var(--cdz-radio-color-border-error, #a73535);
  }

  input.circle:disabled {
    border-color: var(--cdz-radio-color-border-disabled, #e8dfe4);
    cursor: not-allowed;
  }

  input.circle:focus-visible {
    outline: 2px solid var(--cdz-radio-color-focus-ring, #5b7fc7);
    outline-offset: 2px;
  }

  /* A plain sibling <span>, not an SVG like cdz-checkbox's mark — a
     filled circle needs no path drawing, just background + border-radius.
     Sits on the transparent ring interior, not on a solid fill, so it
     reuses the accent color directly instead of needing a
     contrast-paired "mark" color the way cdz-checkbox's checkmark does. */
  .dot {
    position: absolute;
    inset: 25%;
    border-radius: 50%;
    background: var(--cdz-radio-color-dot-default, #7a5197);
    opacity: 0;
    pointer-events: none;
  }

  input.circle:checked + .dot {
    opacity: 1;
  }

  input.circle:disabled + .dot {
    background: var(--cdz-radio-color-dot-disabled, #8a7c87);
  }

  label {
    font-family: var(--cdz-radio-typography-label-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-radio-typography-label-font-size, 1rem);
    font-weight: var(--cdz-radio-typography-label-font-weight, 500);
    color: var(--cdz-radio-color-text-label, #2c2230);
    cursor: pointer;
  }

  .caption {
    font-family: var(--cdz-radio-typography-caption-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-radio-typography-caption-font-size, 0.875rem);
    font-weight: var(--cdz-radio-typography-caption-font-weight, 400);
    margin: 0;
    padding-left: calc(var(--cdz-radio-size, 1rem) + var(--cdz-radio-spacing-gap, 0.5rem));
  }

  .caption.helper {
    color: var(--cdz-radio-color-text-helper, #6e6169);
  }

  .caption.error {
    color: var(--cdz-radio-color-text-error, #a73535);
  }
`;
