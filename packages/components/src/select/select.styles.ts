import { css } from 'lit';

// Same static-fallback convention as every other component. The trigger
// button replaces what used to be a real <select> (see select.ts's class
// comment for why); the listbox rules below style the <ul>/<li> rendered
// inside the slotted <cdz-popover> -- cdz-popover already owns the panel's
// own surface (background/border/shadow/radius), this only styles the
// list itself.
export const selectStyles = css`
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


  .field {
    display: flex;
    flex-direction: column;
    gap: var(--cdz-select-spacing-label-gap, 0.5rem);
  }

  label {
    font-family: var(--cdz-select-typography-label-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-select-typography-label-font-size, 1rem);
    font-weight: var(--cdz-select-typography-label-font-weight, 500);
    color: var(--cdz-select-color-text-label, #2c2230);
  }

  .select-wrapper {
    position: relative;
    display: block;
  }

  #trigger {
    appearance: none;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    font-family: var(--cdz-select-typography-value-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-select-typography-value-font-size, 1rem);
    font-weight: var(--cdz-select-typography-value-font-weight, 400);
    padding-inline: var(--cdz-select-spacing-padding-inline, 0.75rem);
    padding-block: var(--cdz-select-spacing-padding-block, 0.5rem);
    border-radius: var(--cdz-select-radius, 0.375rem);
    border: var(--cdz-select-border-width, 1px) solid var(--cdz-select-color-border-default, #8a7c87);
    background-color: var(--cdz-select-color-background-default, #faf4f6);
    color: var(--cdz-select-color-text-value, #2c2230);
    cursor: pointer;
    text-align: start;
  }

  #trigger .value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* Mirrors the old placeholder-option treatment: a hint, not real
     content, styled to read as such. */
  #trigger[data-placeholder] .value {
    color: var(--cdz-select-color-text-placeholder, #6e6169);
  }

  #trigger:focus-visible {
    outline: 2px solid var(--cdz-select-color-border-focus, #5b7fc7);
    outline-offset: 2px;
  }

  #trigger[aria-invalid='true'] {
    border-color: var(--cdz-select-color-border-error, #a73535);
  }

  #trigger:disabled {
    background-color: var(--cdz-select-color-background-disabled, #e8dfe4);
    border-color: var(--cdz-select-color-border-disabled, #e8dfe4);
    color: var(--cdz-select-color-text-disabled, #8a7c87);
    cursor: not-allowed;
  }

  /* 16px on a 24-unit grid renders the shared stroke width of 2 as
     ~1.33 real pixels — the same rendered weight as cdz-checkbox's mark
     and cdz-link's external icon. See shared/icons.ts for the grid. */
  .chevron {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    stroke: var(--cdz-select-color-chevron-default, #6e6169);
    stroke-width: 2;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  #trigger:disabled .chevron {
    stroke: var(--cdz-select-color-chevron-disabled, #8a7c87);
  }

  #listbox {
    list-style: none;
    margin: 0;
    padding: 0;
    width: 100%;
  }

  #listbox li {
    padding-inline: var(--cdz-select-spacing-padding-inline, 0.75rem);
    padding-block: var(--cdz-select-spacing-padding-block, 0.5rem);
    border-radius: var(--cdz-select-radius, 0.375rem);
    cursor: pointer;
    white-space: nowrap;
  }

  #listbox li[aria-disabled='true'] {
    color: var(--cdz-select-color-option-text-disabled, #8a7c87);
    cursor: not-allowed;
  }

  #listbox li.active {
    background-color: var(--cdz-select-color-option-background-active, #e8dfe4);
  }

  #listbox li[aria-selected='true'] {
    font-weight: var(--cdz-select-typography-label-font-weight, 500);
  }

  .caption {
    font-family: var(--cdz-select-typography-caption-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-select-typography-caption-font-size, 0.875rem);
    font-weight: var(--cdz-select-typography-caption-font-weight, 400);
    margin: 0;
  }

  .caption.helper {
    color: var(--cdz-select-color-text-helper, #6e6169);
  }

  .caption.error {
    color: var(--cdz-select-color-text-error, #a73535);
  }
`;
