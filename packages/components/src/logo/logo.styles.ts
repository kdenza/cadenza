import { css } from 'lit';

// Same static-fallback convention as every other component.
export const logoStyles = css`
  :host {
    display: inline-flex;
    --_cdz-logo-size: var(--cdz-logo-sizing-md, 2rem);
  }

  /* Without this the hidden attribute does nothing on this component: the
     browser's [hidden] { display: none } is a UA rule, and the :host above
     is an author rule, so the author rule wins and the element stays
     visible. Mandatory counterpart to any display -- see ADR-0025. */
  :host([hidden]) {
    display: none;
  }

  :host([size='sm']) {
    --_cdz-logo-size: var(--cdz-logo-sizing-sm, 1.25rem);
  }

  :host([size='lg']) {
    --_cdz-logo-size: var(--cdz-logo-sizing-lg, 2.75rem);
  }

  /* Carries the actual box and the accessibility attributes -- :host stays
     a plain layout pass-through, same split as cdz-avatar's .avatar. */
  .logo {
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    line-height: 1;
  }

  .logo.with-wordmark {
    gap: var(--cdz-logo-spacing-gap, 0.5rem);
  }

  .logo.orientation-vertical {
    flex-direction: column;
  }

  svg {
    display: block;
    overflow: visible;
    width: var(--_cdz-logo-size);
    height: var(--_cdz-logo-size);
  }

  /* 'color' variant, the default: each petal is its own palette token.
     Brand colour does not fork by mode -- see ADR-0002 and this
     component's own ADR -- so these resolve to the same value in light
     and dark. */
  .petal-primary {
    fill: var(--cdz-logo-color-petal-primary, #7a5197);
  }

  .petal-secondary {
    fill: var(--cdz-logo-color-petal-secondary, #b08fcb);
  }

  .petal-tertiary {
    fill: var(--cdz-logo-color-petal-tertiary, #bfa0d6);
  }

  .petal-accent {
    fill: var(--cdz-logo-color-petal-accent, #c96a85);
  }

  .center {
    fill: var(--cdz-logo-color-center, #5b7fc7);
  }

  .halo {
    fill: var(--cdz-logo-color-halo, #bfa0d6);
  }

  /* 'mono': every shape takes the surrounding text colour. The halo stays
     at reduced opacity so the centre still reads as the focal point. */
  :host([variant='mono']) .petal-primary,
  :host([variant='mono']) .petal-secondary,
  :host([variant='mono']) .petal-tertiary,
  :host([variant='mono']) .petal-accent,
  :host([variant='mono']) .center {
    fill: currentColor;
  }

  :host([variant='mono']) .halo,
  :host([variant='outline']) .halo {
    fill: currentColor;
    opacity: 0.4;
  }

  /* 'outline': petals are stroked, not filled; the centre stays filled
     (there is nothing left to outline once it's this small). The reduced
     mark has no petals to stroke, so it falls back to the 'mono'
     treatment -- see the ADR for why that is an inferred default rather
     than something the handoff specified. */
  :host([variant='outline']) .petal-primary,
  :host([variant='outline']) .petal-secondary,
  :host([variant='outline']) .petal-tertiary,
  :host([variant='outline']) .petal-accent {
    fill: none;
    stroke: currentColor;
    stroke-width: var(--cdz-logo-stroke-width, 8);
    stroke-linejoin: round;
  }

  :host([variant='outline']) .center {
    fill: currentColor;
  }

  .wordmark {
    font-family: var(--cdz-logo-typography-font-family, 'Figtree', system-ui, sans-serif);
    font-weight: var(--cdz-logo-typography-font-weight, 600);
    letter-spacing: var(--cdz-logo-typography-letter-spacing, -0.01em);
    color: currentColor;
    /* The mark is painted at a fixed CSS size and does not respond to the
       page's font-size, so the wordmark can't use em/ch here either --
       each size step gets its own absolute value, same reasoning as the
       mark itself. */
    user-select: none;
  }

  :host([size='sm']) .wordmark {
    font-size: var(--cdz-logo-typography-font-size-sm, 0.875rem);
  }

  :host([size='md']) .wordmark {
    font-size: var(--cdz-logo-typography-font-size-md, 1.25rem);
  }

  :host([size='lg']) .wordmark {
    font-size: var(--cdz-logo-typography-font-size-lg, 2rem);
  }
`;
