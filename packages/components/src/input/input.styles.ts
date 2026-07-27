import { css } from 'lit';

// Every custom property has a static fallback, same convention as
// cdz-button — see button.styles.ts.
export const inputStyles = css`
  :host {
    display: block;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--cdz-input-spacing-label-gap, 0.5rem);
  }

  label {
    font-family: var(--cdz-input-typography-label-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-input-typography-label-font-size, 1rem);
    font-weight: var(--cdz-input-typography-label-font-weight, 500);
    color: var(--cdz-input-color-text-label, #2c2230);
  }

  input {
    font-family: var(--cdz-input-typography-value-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-input-typography-value-font-size, 1rem);
    font-weight: var(--cdz-input-typography-value-font-weight, 400);
    padding-inline: var(--cdz-input-spacing-padding-inline, 0.75rem);
    padding-block: var(--cdz-input-spacing-padding-block, 0.5rem);
    border-radius: var(--cdz-input-radius, 0.375rem);
    border: var(--cdz-input-border-width, 1px) solid var(--cdz-input-color-border-default, #8a7c87);
    background-color: var(--cdz-input-color-background-default, #faf4f6);
    color: var(--cdz-input-color-text-value, #2c2230);
    width: 100%;
    box-sizing: border-box;
  }

  /* Firefox mutes placeholders to 0.5 opacity by default, double-muting an
     already-muted token color — force it back to 1 so the token is the
     only thing controlling how subdued the placeholder looks. */
  input::placeholder {
    color: var(--cdz-input-color-text-placeholder, #6e6169);
    opacity: 1;
  }

  input:focus-visible {
    outline: 2px solid var(--cdz-input-color-border-focus, #5b7fc7);
    outline-offset: 2px;
    border-color: var(--cdz-input-color-border-focus, #5b7fc7);
  }

  input[aria-invalid='true'] {
    border-color: var(--cdz-input-color-border-error, #a73535);
  }

  input:disabled {
    background-color: var(--cdz-input-color-background-disabled, #e8dfe4);
    border-color: var(--cdz-input-color-border-disabled, #e8dfe4);
    color: var(--cdz-input-color-text-disabled, #8a7c87);
    cursor: not-allowed;
  }

  .caption {
    font-family: var(--cdz-input-typography-caption-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-input-typography-caption-font-size, 0.875rem);
    font-weight: var(--cdz-input-typography-caption-font-weight, 400);
    margin: 0;
  }

  .caption.helper {
    color: var(--cdz-input-color-text-helper, #6e6169);
  }

  .caption.error {
    color: var(--cdz-input-color-text-error, #a73535);
  }
`;
