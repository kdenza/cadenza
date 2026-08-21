import { css } from 'lit';

// Same static-fallback convention as cdz-checkbox — see checkbox.styles.ts.
export const switchStyles = css`
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
    gap: var(--cdz-switch-spacing-gap, 0.5rem);
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--cdz-switch-spacing-gap, 0.5rem);
  }

  .control-wrapper {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    width: var(--cdz-switch-sizing-track-width, 2.25rem);
    height: var(--cdz-switch-sizing-track-height, 1.25rem);
  }

  /* The native checkbox stays the real interactive element (role="switch"
     only changes what AT announces, not the underlying behavior) and IS
     the track's own visual fill -- appearance: none only strips its
     default paint. The thumb is a sibling <span>, not a pseudo-element on
     the input, same reasoning as cdz-checkbox's mark: ::before/::after
     don't reliably render on replaced elements like <input> across
     browsers. */
  input.track {
    appearance: none;
    margin: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    border: var(--cdz-switch-border-width, 2px) solid transparent;
    border-radius: 9999px;
    background-color: var(--cdz-switch-color-track-off, #8a7c87);
    background-clip: padding-box;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  input.track:checked {
    background-color: var(--cdz-switch-color-track-on, #7a5197);
  }

  input.track[aria-invalid='true'] {
    border-color: var(--cdz-switch-color-track-error, #a73535);
  }

  input.track:disabled {
    background-color: var(--cdz-switch-color-track-disabled, #e8dfe4);
    cursor: not-allowed;
  }

  input.track:focus-visible {
    outline: 2px solid var(--cdz-switch-color-focus-ring, #5b7fc7);
    outline-offset: 2px;
  }

  .thumb {
    position: absolute;
    top: var(--cdz-switch-sizing-thumb-inset, 0.125rem);
    left: var(--cdz-switch-sizing-thumb-inset, 0.125rem);
    width: var(--cdz-switch-sizing-thumb-size, 1rem);
    height: var(--cdz-switch-sizing-thumb-size, 1rem);
    border-radius: 50%;
    background-color: var(--cdz-switch-color-thumb-default, #ffffff);
    pointer-events: none;
    transition: transform 0.15s ease;
  }

  input.track:checked + .thumb {
    transform: translateX(
      calc(
        var(--cdz-switch-sizing-track-width, 2.25rem) -
          var(--cdz-switch-sizing-thumb-size, 1rem) -
          (2 * var(--cdz-switch-sizing-thumb-inset, 0.125rem))
      )
    );
  }

  input.track:disabled + .thumb {
    background-color: var(--cdz-switch-color-thumb-disabled, #8a7c87);
  }

  label {
    font-family: var(--cdz-switch-typography-label-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-switch-typography-label-font-size, 1rem);
    font-weight: var(--cdz-switch-typography-label-font-weight, 500);
    color: var(--cdz-switch-color-text-label, #2c2230);
    cursor: pointer;
  }

  .caption {
    font-family: var(--cdz-switch-typography-caption-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-switch-typography-caption-font-size, 0.875rem);
    font-weight: var(--cdz-switch-typography-caption-font-weight, 400);
    margin: 0;
    padding-left: calc(var(--cdz-switch-sizing-track-width, 2.25rem) + var(--cdz-switch-spacing-gap, 0.5rem));
  }

  .caption.helper {
    color: var(--cdz-switch-color-text-helper, #6e6169);
  }

  .caption.error {
    color: var(--cdz-switch-color-text-error, #a73535);
  }
`;
