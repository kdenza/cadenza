import { css } from 'lit';

// Same static-fallback convention as every other component.
export const iconStyles = css`
  /* inline-flex, so the icon sits in a line of text without the
     baseline gap an inline replaced element would leave underneath. */
  :host {
    display: inline-flex;
    --_cdz-icon-size: var(--cdz-icon-sizing-md, 1.25rem);
  }

  /* Sin esto, el atributo hidden no hace nada en este componente: la regla
     [hidden] { display: none } del navegador es de origen UA, y el :host de
     arriba es de autor, así que gana el de autor y el elemento se sigue
     viendo. Es la contrapartida obligatoria de cualquier :host que fije
     display -- ver ADR-0025. */
  :host([hidden]) {
    display: none;
  }

  :host([size='sm']) {
    --_cdz-icon-size: var(--cdz-icon-sizing-sm, 1rem);
  }

  :host([size='lg']) {
    --_cdz-icon-size: var(--cdz-icon-sizing-lg, 1.5rem);
  }

  /* Matches the surrounding text instead of a fixed step. The em unit is
     the whole point here -- cdz-link's external icon already needed this
     (ADR-0015), which is why it's a first-class option rather than
     something a consumer has to override by hand. */
  :host([size='inherit']) {
    --_cdz-icon-size: 1em;
  }

  svg {
    width: var(--_cdz-icon-size);
    height: var(--_cdz-icon-size);
    /* No fill and no stroke colour of its own: currentColor means the
       icon takes the text colour of wherever it's placed, which is the
       main reason this system is SVG and not an icon font (ADR-0016). */
    fill: none;
    stroke: currentColor;
    stroke-width: var(--cdz-icon-stroke-width, 2);
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;
