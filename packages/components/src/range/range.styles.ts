import { css } from 'lit';

// Same static-fallback convention as every other component. Vendor-
// prefixed track/thumb pseudo-elements are duplicated per engine on
// purpose -- verified directly (CSS.supports('selector(::slider-thumb)')
// and friends all return false in the Chrome this project tests against)
// that the standardized, unprefixed slider pseudo-elements aren't shipped
// yet anywhere. `::-webkit-*` was empirically confirmed; the `::-moz-*`
// rules follow Firefox's long-stable, well-documented syntax but weren't
// tested in-browser here (this project's tooling is Chrome-only).
export const rangeStyles = css`
  :host {
    display: block;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--cdz-range-spacing-gap, 0.5rem);
  }

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--cdz-range-spacing-gap, 0.5rem);
  }

  label {
    font-family: var(--cdz-range-typography-label-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-range-typography-label-font-size, 1rem);
    font-weight: var(--cdz-range-typography-label-font-weight, 500);
    color: var(--cdz-range-color-text-label, #2c2230);
  }

  output {
    font-family: var(--cdz-range-typography-value-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-range-typography-value-font-size, 1rem);
    font-weight: var(--cdz-range-typography-value-font-weight, 500);
    color: var(--cdz-range-color-text-value, #2c2230);
  }

  input[type='range'] {
    appearance: none;
    width: 100%;
    margin: 0;
    background: transparent;
    cursor: pointer;
  }

  input[type='range']:disabled {
    cursor: not-allowed;
  }

  /* The fill is a two-stop gradient on the track, not a separate
     element -- neither engine exposes a cross-browser "filled portion"
     pseudo-element (Firefox's ::-moz-range-progress has no Chrome
     equivalent). --cdz-range-fill-percent is set imperatively in
     updated() because it depends on value/min/max math, not something
     expressible as a static CSS rule. */
  input[type='range']::-webkit-slider-runnable-track {
    height: var(--cdz-range-sizing-track-height, 0.375rem);
    border-radius: 9999px;
    background: linear-gradient(
      to right,
      var(--cdz-range-color-fill-default, #7a5197) var(--cdz-range-fill-percent, 50%),
      var(--cdz-range-color-track-default, #8a7c87) var(--cdz-range-fill-percent, 50%)
    );
  }

  input[type='range']::-moz-range-track {
    height: var(--cdz-range-sizing-track-height, 0.375rem);
    border-radius: 9999px;
    background: linear-gradient(
      to right,
      var(--cdz-range-color-fill-default, #7a5197) var(--cdz-range-fill-percent, 50%),
      var(--cdz-range-color-track-default, #8a7c87) var(--cdz-range-fill-percent, 50%)
    );
  }

  input[type='range'][aria-invalid='true']::-webkit-slider-runnable-track {
    box-shadow: 0 0 0 2px var(--cdz-range-color-error, #a73535);
  }

  input[type='range'][aria-invalid='true']::-moz-range-track {
    box-shadow: 0 0 0 2px var(--cdz-range-color-error, #a73535);
  }

  input[type='range']:disabled::-webkit-slider-runnable-track,
  input[type='range']:disabled::-moz-range-track {
    background: var(--cdz-range-color-track-disabled, #e8dfe4);
  }

  /* WebKit doesn't auto-center a custom thumb against a custom track
     height the way Firefox does -- the margin-top math is required here
     specifically, a real quirk of this pseudo-element, not a mistake. */
  input[type='range']::-webkit-slider-thumb {
    appearance: none;
    width: var(--cdz-range-sizing-thumb-size, 1.25rem);
    height: var(--cdz-range-sizing-thumb-size, 1.25rem);
    border-radius: 50%;
    border: none;
    background: var(--cdz-range-color-thumb-default, #ffffff);
    cursor: pointer;
    margin-top: calc(
      (var(--cdz-range-sizing-track-height, 0.375rem) - var(--cdz-range-sizing-thumb-size, 1.25rem)) / 2
    );
  }

  input[type='range']::-moz-range-thumb {
    width: var(--cdz-range-sizing-thumb-size, 1.25rem);
    height: var(--cdz-range-sizing-thumb-size, 1.25rem);
    border-radius: 50%;
    border: none;
    background: var(--cdz-range-color-thumb-default, #ffffff);
    cursor: pointer;
  }

  input[type='range']:disabled::-webkit-slider-thumb,
  input[type='range']:disabled::-moz-range-thumb {
    background: var(--cdz-range-color-thumb-disabled, #8a7c87);
  }

  input[type='range']:focus-visible::-webkit-slider-thumb {
    outline: 2px solid var(--cdz-range-color-focus-ring, #5b7fc7);
    outline-offset: 2px;
  }

  input[type='range']:focus-visible::-moz-range-thumb {
    outline: 2px solid var(--cdz-range-color-focus-ring, #5b7fc7);
    outline-offset: 2px;
  }

  .caption {
    font-family: var(--cdz-range-typography-caption-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-range-typography-caption-font-size, 0.875rem);
    font-weight: var(--cdz-range-typography-caption-font-weight, 400);
    margin: 0;
  }

  .caption.helper {
    color: var(--cdz-range-color-text-helper, #6e6169);
  }

  .caption.error {
    color: var(--cdz-range-color-text-error, #a73535);
  }
`;
