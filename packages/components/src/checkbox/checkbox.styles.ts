import { css } from 'lit';

// Same static-fallback convention as cdz-button/cdz-input.
export const checkboxStyles = css`
  :host {
    display: inline-block;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--cdz-checkbox-spacing-gap, 0.5rem);
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--cdz-checkbox-spacing-gap, 0.5rem);
  }

  .control-wrapper {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    width: var(--cdz-checkbox-size, 1rem);
    height: var(--cdz-checkbox-size, 1rem);
  }

  /* The native checkbox stays the real interactive element — appearance:
     none only strips its default paint, it keeps every native behavior
     (keyboard toggling, form participation, indeterminate support). The
     checkmark is a sibling <svg>, not a pseudo-element on the input:
     ::before/::after don't reliably render on replaced elements like
     <input> across browsers. */
  input.box {
    appearance: none;
    margin: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border: var(--cdz-checkbox-border-width, 1px) solid var(--cdz-checkbox-color-border-default, #8a7c87);
    border-radius: var(--cdz-checkbox-radius, 0.375rem);
    background-color: transparent;
    cursor: pointer;
  }

  input.box:checked,
  input.box.is-indeterminate {
    background-color: var(--cdz-checkbox-color-background-checked, #7a5197);
    border-color: var(--cdz-checkbox-color-border-checked, #7a5197);
  }

  input.box[aria-invalid='true'] {
    border-color: var(--cdz-checkbox-color-border-error, #a73535);
  }

  input.box:disabled {
    background-color: var(--cdz-checkbox-color-background-disabled, #e8dfe4);
    border-color: var(--cdz-checkbox-color-border-disabled, #e8dfe4);
    cursor: not-allowed;
  }

  input.box:focus-visible {
    outline: 2px solid var(--cdz-checkbox-color-focus-ring, #5b7fc7);
    outline-offset: 2px;
  }

  .mark {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .mark .check-mark,
  .mark .dash-mark {
    opacity: 0;
    stroke: var(--cdz-checkbox-color-mark, #ffffff);
    stroke-width: 2;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  input.box:checked + .mark .check-mark {
    opacity: 1;
  }

  input.box.is-indeterminate + .mark .dash-mark {
    opacity: 1;
  }

  input.box:disabled + .mark .check-mark,
  input.box:disabled + .mark .dash-mark {
    stroke: var(--cdz-checkbox-color-text-disabled, #8a7c87);
  }

  label {
    font-family: var(--cdz-checkbox-typography-label-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-checkbox-typography-label-font-size, 1rem);
    font-weight: var(--cdz-checkbox-typography-label-font-weight, 500);
    color: var(--cdz-checkbox-color-text-label, #2c2230);
    cursor: pointer;
  }

  .caption {
    font-family: var(--cdz-checkbox-typography-caption-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-checkbox-typography-caption-font-size, 0.875rem);
    font-weight: var(--cdz-checkbox-typography-caption-font-weight, 400);
    margin: 0;
    padding-left: calc(var(--cdz-checkbox-size, 1rem) + var(--cdz-checkbox-spacing-gap, 0.5rem));
  }

  .caption.helper {
    color: var(--cdz-checkbox-color-text-helper, #6e6169);
  }

  .caption.error {
    color: var(--cdz-checkbox-color-text-error, #a73535);
  }
`;
