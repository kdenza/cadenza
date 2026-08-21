import { css } from 'lit';

// Same static-fallback convention as every other component.
//
// The vendor-prefixed rules are duplicated per engine for the same reason
// as cdz-range (ADR-0013): no standardised pseudo-elements exist for
// <progress> yet -- verified that ::progress-bar and ::progress-value are
// both unsupported, while the ::-webkit-* pair is.
//
// The two engines split the work differently, which is why the track
// colour appears twice: WebKit paints the track in
// ::-webkit-progress-bar, whereas Firefox paints it on the element itself
// and uses ::-moz-progress-bar for the fill.
export const progressStyles = css`
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
    gap: var(--cdz-progress-spacing-gap, 0.5rem);
  }

  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--cdz-progress-spacing-gap, 0.5rem);
  }

  label {
    font-family: var(--cdz-progress-typography-label-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-progress-typography-label-font-size, 1rem);
    font-weight: var(--cdz-progress-typography-label-font-weight, 500);
    color: var(--cdz-progress-color-text-label, #2c2230);
  }

  .value {
    font-family: var(--cdz-progress-typography-value-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-progress-typography-value-font-size, 1rem);
    font-weight: var(--cdz-progress-typography-value-font-weight, 500);
    color: var(--cdz-progress-color-text-value, #2c2230);
  }

  progress {
    appearance: none;
    border: none;
    display: block;
    width: 100%;
    height: var(--cdz-progress-sizing-height, 0.5rem);
    border-radius: 9999px;
    overflow: hidden;
    /* Firefox's track, and the fallback anywhere the pseudo-elements
       below don't apply. */
    background-color: var(--cdz-progress-color-track, #8a7c87);
  }

  progress::-webkit-progress-bar {
    background-color: var(--cdz-progress-color-track, #8a7c87);
    border-radius: 9999px;
  }

  progress::-webkit-progress-value {
    background-color: var(--cdz-progress-color-fill, #7a5197);
    border-radius: 9999px;
  }

  progress::-moz-progress-bar {
    background-color: var(--cdz-progress-color-fill, #7a5197);
    border-radius: 9999px;
  }
`;
