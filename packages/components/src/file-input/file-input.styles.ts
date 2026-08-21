import { css } from 'lit';

// Same static-fallback convention as every other component. The `:has()`
// selectors below follow the precedent already set in select.styles.ts.
export const fileInputStyles = css`
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
    gap: var(--cdz-file-input-spacing-label-gap, 0.5rem);
  }

  label {
    font-family: var(--cdz-file-input-typography-label-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-file-input-typography-label-font-size, 1rem);
    font-weight: var(--cdz-file-input-typography-label-font-weight, 500);
    color: var(--cdz-file-input-color-text-label, #2c2230);
  }

  /* Visually hidden but STILL FOCUSABLE. Deliberately not display:none
     or visibility:hidden, both of which remove the element from the tab
     order entirely -- verified in-browser that a display:none file input
     refuses focus while this clipped one accepts it. The native input
     stays the real, focusable, keyboard-operable control; everything
     visible below is chrome we draw ourselves. */
  input[type='file'] {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  .control {
    display: flex;
    align-items: center;
    gap: var(--cdz-file-input-spacing-gap, 0.75rem);
    box-sizing: border-box;
    width: 100%;
    padding-inline: var(--cdz-file-input-spacing-padding-inline, 0.75rem);
    padding-block: var(--cdz-file-input-spacing-padding-block, 0.5rem);
    border-radius: var(--cdz-file-input-radius, 0.375rem);
    border: var(--cdz-file-input-border-width, 1px) solid
      var(--cdz-file-input-color-border-default, #8a7c87);
    background-color: var(--cdz-file-input-color-background-default, #faf4f6);
    cursor: pointer;
  }

  /* The focus ring is drawn on the box, not the (invisible) input --
     without this, keyboard focus would be completely undetectable. */
  .control:has(input:focus-visible) {
    outline: 2px solid var(--cdz-file-input-color-border-focus, #5b7fc7);
    outline-offset: 2px;
    border-color: var(--cdz-file-input-color-border-focus, #5b7fc7);
  }

  .control:has(input[aria-invalid='true']) {
    border-color: var(--cdz-file-input-color-border-error, #a73535);
  }

  .control:has(input:disabled) {
    background-color: var(--cdz-file-input-color-background-disabled, #e8dfe4);
    border-color: var(--cdz-file-input-color-border-disabled, #e8dfe4);
    cursor: not-allowed;
  }

  .trigger {
    flex-shrink: 0;
    font-family: var(--cdz-file-input-typography-trigger-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-file-input-typography-trigger-font-size, 1rem);
    font-weight: var(--cdz-file-input-typography-trigger-font-weight, 500);
    color: var(--cdz-file-input-color-text-trigger, #7a5197);
  }

  .filename {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--cdz-file-input-typography-filename-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-file-input-typography-filename-font-size, 1rem);
    font-weight: var(--cdz-file-input-typography-filename-font-weight, 400);
    color: var(--cdz-file-input-color-text-filename, #2c2230);
  }

  .filename.is-placeholder {
    color: var(--cdz-file-input-color-text-placeholder, #6e6169);
  }

  .control:has(input:disabled) .trigger,
  .control:has(input:disabled) .filename {
    color: var(--cdz-file-input-color-text-disabled, #8a7c87);
  }

  .caption {
    font-family: var(--cdz-file-input-typography-caption-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-file-input-typography-caption-font-size, 0.875rem);
    font-weight: var(--cdz-file-input-typography-caption-font-weight, 400);
    margin: 0;
  }

  .caption.helper {
    color: var(--cdz-file-input-color-text-helper, #6e6169);
  }

  .caption.error {
    color: var(--cdz-file-input-color-text-error, #a73535);
  }
`;
