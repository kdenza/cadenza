import { css } from 'lit';

// Same static-fallback convention as every other component. The floating
// surface itself (background, border, shadow, radius, padding) comes from
// cdz-popover — this only adds the text treatment and the width cap.
export const tooltipStyles = css`
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


  /* ::slotted, not a plain descendant selector: the bubble is built in
     the light DOM (see tooltip.ts) because anchor positioning is
     tree-scoped and would not resolve from inside this shadow root. */
  ::slotted([data-cdz-tooltip-bubble]) {
    max-width: var(--cdz-tooltip-sizing-max-width, 16rem);
    color: var(--cdz-tooltip-color-text, #2c2230);
    font-family: var(--cdz-tooltip-typography-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-tooltip-typography-font-size, 0.875rem);
    font-weight: var(--cdz-tooltip-typography-font-weight, 400);
    line-height: 1.4;
    /* Wraps rather than stretching off-screen for a long description. */
    white-space: normal;
  }

  /* The visually hidden node that actually carries the description to
     assistive technology. It is slotted (light DOM) on purpose — see
     tooltip.ts — so it must be hidden by clipping rather than
     display:none, which would drop it out of the accessibility tree and
     defeat the whole arrangement. */
  ::slotted([data-cdz-tooltip-text]) {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip-path: inset(50%) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }
`;
