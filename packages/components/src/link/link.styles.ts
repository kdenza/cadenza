import { css } from 'lit';

// Same static-fallback convention as every other component.
//
// Note what is deliberately ABSENT: font-family, font-size and
// font-weight. Every other atom sets its own typography, because every
// other atom is a block-level control with its own visual identity. A
// link is inline content that usually sits inside a sentence, so it has
// to inherit whatever the surrounding text is using -- setting a size
// here would make a link inside a heading render at body size.
export const linkStyles = css`
  :host {
    /* inline, not inline-block: an inline-block link inside a paragraph
       would refuse to wrap across lines mid-phrase. */
    display: inline;
  }

  /* Sin esto, el atributo hidden no hace nada en este componente: la regla
     [hidden] { display: none } del navegador es de origen UA, y el :host de
     arriba es de autor, así que gana el de autor y el elemento se sigue
     viendo. Es la contrapartida obligatoria de cualquier :host que fije
     display -- ver ADR-0025. */
  :host([hidden]) {
    display: none;
  }


  a {
    color: var(--cdz-link-color-default, #7a5197);
    font: inherit;
    /* Always underlined, never color-only. WCAG 1.4.1 (Use of Color):
       color alone can't be the only thing distinguishing a link from
       body text, and body-copy links are the canonical example. */
    text-decoration: underline;
    text-underline-offset: var(--cdz-link-underline-offset, 0.15em);
    text-decoration-thickness: var(--cdz-link-underline-thickness, 0.08em);
    border-radius: 2px;
  }

  a:hover {
    color: var(--cdz-link-color-hover, #6b4587);
  }

  a:focus-visible {
    outline: 2px solid var(--cdz-link-color-focus-ring, #5b7fc7);
    outline-offset: 2px;
  }

  /* Marks the "opens in a new tab" note as screen-reader-only. Same
     clip technique as cdz-file-input's hidden input, for the same
     reason: it must stay in the accessibility tree, so display:none
     and visibility:hidden are both wrong. */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  /* Sized in em, not px: an inline icon has to scale with the sentence
     it sits in, the same reason this component inherits its typography.
     At a 16px context that lands on the same ~1.33px rendered stroke as
     the other icons in the set -- see shared/icons.ts. */
  .external-icon {
    display: inline-block;
    width: 1em;
    height: 1em;
    margin-inline-start: 0.25em;
    vertical-align: -0.15em;
    stroke: currentColor;
    stroke-width: 2;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;
