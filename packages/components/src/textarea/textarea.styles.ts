import { css } from 'lit';

// Same static-fallback convention as cdz-input — see input.styles.ts.
// Token names differ only in the component prefix (cdz-textarea vs.
// cdz-input); every other value is byte-for-byte the same reused role.
export const textareaStyles = css`
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
    gap: var(--cdz-textarea-spacing-label-gap, 0.5rem);
  }

  label {
    font-family: var(--cdz-textarea-typography-label-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-textarea-typography-label-font-size, 1rem);
    font-weight: var(--cdz-textarea-typography-label-font-weight, 500);
    color: var(--cdz-textarea-color-text-label, #2c2230);
  }

  textarea {
    font-family: var(--cdz-textarea-typography-value-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-textarea-typography-value-font-size, 1rem);
    font-weight: var(--cdz-textarea-typography-value-font-weight, 400);
    padding-inline: var(--cdz-textarea-spacing-padding-inline, 0.75rem);
    padding-block: var(--cdz-textarea-spacing-padding-block, 0.5rem);
    border-radius: var(--cdz-textarea-radius, 0.375rem);
    border: var(--cdz-textarea-border-width, 1px) solid var(--cdz-textarea-color-border-default, #8a7c87);
    background-color: var(--cdz-textarea-color-background-default, #faf4f6);
    color: var(--cdz-textarea-color-text-value, #2c2230);
    width: 100%;
    box-sizing: border-box;
    /* Vertical-only: the field's width is governed by its container like
       any other block-level form control (an <input> can't be widened by
       dragging either), but a taller text area is a real, common need a
       fixed rows count can't always predict -- letting height grow keeps
       that useful without breaking the surrounding layout horizontally. */
    resize: vertical;
  }

  textarea::placeholder {
    color: var(--cdz-textarea-color-text-placeholder, #6e6169);
    opacity: 1;
  }

  textarea:focus-visible {
    outline: 2px solid var(--cdz-textarea-color-border-focus, #5b7fc7);
    outline-offset: 2px;
    border-color: var(--cdz-textarea-color-border-focus, #5b7fc7);
  }

  textarea[aria-invalid='true'] {
    border-color: var(--cdz-textarea-color-border-error, #a73535);
  }

  textarea:disabled {
    background-color: var(--cdz-textarea-color-background-disabled, #e8dfe4);
    border-color: var(--cdz-textarea-color-border-disabled, #e8dfe4);
    color: var(--cdz-textarea-color-text-disabled, #8a7c87);
    cursor: not-allowed;
    resize: none;
  }

  .caption {
    font-family: var(--cdz-textarea-typography-caption-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-textarea-typography-caption-font-size, 0.875rem);
    font-weight: var(--cdz-textarea-typography-caption-font-weight, 400);
    margin: 0;
  }

  .caption.helper {
    color: var(--cdz-textarea-color-text-helper, #6e6169);
  }

  .caption.error {
    color: var(--cdz-textarea-color-text-error, #a73535);
  }
`;
