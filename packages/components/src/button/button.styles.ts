import { css } from 'lit';

// Every custom property has a static fallback so `<cdz-button>` still renders
// a legible, on-brand button even if the consuming page hasn't loaded
// @cadenza/tokens' generated CSS yet (or is missing it entirely).
export const buttonStyles = css`
  :host {
    display: inline-block;
  }

  button {
    font-family: var(--cdz-button-typography-font-family, system-ui, sans-serif);
    font-size: var(--cdz-button-typography-font-size, 1rem);
    font-weight: var(--cdz-button-typography-font-weight, 500);
    line-height: 1.5;
    padding-inline: var(--cdz-button-spacing-padding-inline, 1rem);
    padding-block: var(--cdz-button-spacing-padding-block, 0.5rem);
    border: none;
    border-radius: var(--cdz-button-radius, 0.375rem);
    background-color: var(--cdz-button-color-background-default, #7a5197);
    color: var(--cdz-button-color-text-default, #ffffff);
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  button:hover {
    background-color: var(--cdz-button-color-background-hover, #6b4587);
  }

  button:active {
    background-color: var(--cdz-button-color-background-active, #6b4587);
  }

  /* Keyboard-only focus indication — evergreen browsers support
     :focus-visible natively, so no polyfill is needed. */
  button:focus-visible {
    outline: 2px solid var(--cdz-button-color-focus-ring, #5b7fc7);
    outline-offset: 2px;
  }

  /* The disabled look is driven by [aria-disabled], not :disabled — see
     button.ts for why the element stays a real, focusable <button>. */
  button[aria-disabled='true'] {
    background-color: var(--cdz-button-color-background-disabled, #e8dfe4);
    color: var(--cdz-button-color-text-disabled, #8a7c87);
    cursor: not-allowed;
  }

  button[aria-disabled='true']:hover,
  button[aria-disabled='true']:active {
    background-color: var(--cdz-button-color-background-disabled, #e8dfe4);
  }
`;
