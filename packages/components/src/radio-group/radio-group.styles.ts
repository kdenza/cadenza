import { css } from 'lit';

// Same static-fallback convention as cdz-radio/cdz-checkbox.
export const radioGroupStyles = css`
  :host {
    display: block;
  }

  /* Without this the hidden attribute does nothing on this component: the
     browser's [hidden] { display: none } is a UA rule, and the :host above
     is an author rule, so the author rule wins and the element stays
     visible. Mandatory counterpart to any display -- see ADR-0025. */
  :host([hidden]) {
    display: none;
  }

  /* A real fieldset, not a div with role=radiogroup. The inputs are native
     radios, and fieldset + legend is the grouping the browser and screen
     readers already understand for them -- see ADR-0029. The UA default
     border and padding are the only reason fieldset is often avoided, so
     they are reset here rather than the element being replaced. */
  fieldset {
    border: 0;
    margin: 0;
    padding: 0;
    min-inline-size: 0;
  }

  legend {
    padding: 0;
    margin-block-end: var(--cdz-radio-group-spacing-legend-gap, 0.75rem);
    font-family: var(--cdz-radio-group-typography-legend-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-radio-group-typography-legend-font-size, 1rem);
    font-weight: var(--cdz-radio-group-typography-legend-font-weight, 500);
    color: var(--cdz-radio-group-color-text-legend, #2c2230);
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: var(--cdz-radio-group-spacing-option-gap, 0.75rem);
  }

  :host([orientation='horizontal']) .options {
    flex-direction: row;
    flex-wrap: wrap;
    column-gap: var(--cdz-radio-group-spacing-horizontal-gap, 1rem);
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--cdz-radio-group-spacing-gap, 0.5rem);
  }

  .control-wrapper {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    width: var(--cdz-radio-group-size, 1rem);
    height: var(--cdz-radio-group-size, 1rem);
  }

  /* The control visuals below are deliberately a copy of cdz-radio's, not
     a shared import: each component owns its own token tier, so the same
     rules resolve through --cdz-radio-group-* here and --cdz-radio-* there.
     The duplication is the cost of that rule and is noted in ADR-0029. */
  input.circle {
    appearance: none;
    margin: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border-radius: 50%;
    border: var(--cdz-radio-group-border-width, 1px) solid
      var(--cdz-radio-group-color-border-default, #8a7c87);
    background: transparent;
    cursor: pointer;
  }

  input.circle:checked {
    border-color: var(--cdz-radio-group-color-border-checked, #7a5197);
  }

  input.circle[aria-invalid='true'] {
    border-color: var(--cdz-radio-group-color-border-error, #a73535);
  }

  input.circle:disabled {
    border-color: var(--cdz-radio-group-color-border-disabled, #e8dfe4);
    cursor: not-allowed;
  }

  input.circle:focus-visible {
    outline: 2px solid var(--cdz-radio-group-color-focus-ring, #5b7fc7);
    outline-offset: 2px;
  }

  .dot {
    position: absolute;
    inset: 25%;
    border-radius: 50%;
    background: var(--cdz-radio-group-color-dot-default, #7a5197);
    opacity: 0;
    pointer-events: none;
  }

  input.circle:checked + .dot {
    opacity: 1;
  }

  input.circle:disabled + .dot {
    background: var(--cdz-radio-group-color-dot-disabled, #8a7c87);
  }

  label {
    font-family: var(--cdz-radio-group-typography-label-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-radio-group-typography-label-font-size, 1rem);
    font-weight: var(--cdz-radio-group-typography-label-font-weight, 500);
    color: var(--cdz-radio-group-color-text-label, #2c2230);
    cursor: pointer;
  }

  input.circle:disabled ~ label,
  .row:has(input.circle:disabled) label {
    color: var(--cdz-radio-group-color-text-disabled, #8a7c87);
    cursor: not-allowed;
  }

  .caption {
    font-family: var(--cdz-radio-group-typography-caption-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-radio-group-typography-caption-font-size, 0.875rem);
    font-weight: var(--cdz-radio-group-typography-caption-font-weight, 400);
    margin: 0;
    margin-block-start: var(--cdz-radio-group-spacing-gap, 0.5rem);
  }

  .caption.helper {
    color: var(--cdz-radio-group-color-text-helper, #6e6169);
  }

  .caption.error {
    color: var(--cdz-radio-group-color-text-error, #a73535);
  }
`;
