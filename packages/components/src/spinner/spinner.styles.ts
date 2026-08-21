import { css } from 'lit';

// Same static-fallback convention as every other component.
export const spinnerStyles = css`
  :host {
    display: inline-flex;
    --_cdz-spinner-size: var(--cdz-spinner-sizing-md, 1.25rem);
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
    --_cdz-spinner-size: var(--cdz-spinner-sizing-sm, 1rem);
  }

  :host([size='lg']) {
    --_cdz-spinner-size: var(--cdz-spinner-sizing-lg, 1.5rem);
  }

  :host([size='inherit']) {
    --_cdz-spinner-size: 1em;
  }

  svg {
    width: var(--_cdz-spinner-size);
    height: var(--_cdz-spinner-size);
    /* currentColor for the same reason cdz-icon uses it: dropped inside a
       button, a link or body text, the spinner takes that context's
       colour with no configuration. See ADR-0016. */
    stroke: currentColor;
    fill: none;
    stroke-width: var(--cdz-spinner-stroke-width, 2.5);
    stroke-linecap: round;
    animation: cdz-spin var(--cdz-spinner-duration, 900ms) linear infinite;
  }

  /* The faint full ring behind the arc. Drawn with opacity rather than a
     second colour token so it stays correct whatever currentColor is —
     a hardcoded track colour would break the moment the spinner sits on
     a filled button. */
  .track {
    opacity: var(--cdz-spinner-track-opacity, 0.25);
  }

  @keyframes cdz-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes cdz-pulse {
    50% {
      opacity: 0.35;
    }
  }

  /* Rotation is exactly the kind of motion that triggers vestibular
     symptoms, so under prefers-reduced-motion it is removed entirely
     rather than slowed down. It is replaced, not just stopped: a frozen
     spinner is indistinguishable from a broken one, and the component's
     whole job is signalling "still working". A gentle opacity pulse
     keeps that signal with no movement across the screen — opacity
     changes are not vestibular triggers, which is why the reduced-motion
     guidance is about motion rather than about all animation. */
  @media (prefers-reduced-motion: reduce) {
    svg {
      animation: cdz-pulse var(--cdz-spinner-reduced-motion-duration, 1600ms)
        ease-in-out infinite;
    }
  }

  /* Visually hidden but kept in the accessibility tree — same clip
     technique, and same reasoning, as cdz-file-input's hidden input and
     cdz-link's new-tab note. */
  .label {
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
`;
