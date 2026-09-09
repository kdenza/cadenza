import { css } from 'lit';

// Same static-fallback convention as the rest of the system.
export const avatarStackStyles = css`
  :host {
    display: inline-flex;
  }

  /* Without this the hidden attribute does nothing on this component: the
     browser's [hidden] { display: none } is a UA rule, and the :host above
     is an author rule, so the author rule wins and the element stays
     visible. Mandatory counterpart to any display -- see ADR-0025. */
  :host([hidden]) {
    display: none;
  }

  ul {
    display: flex;
    align-items: center;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  /* The overlap. Every item after the first slides back over the one
     before it, and the ring is what keeps them readable as separate
     people rather than one smear -- it matches the page background, so
     each avatar reads as cut out of the one behind. */
  li + li {
    margin-inline-start: calc(var(--_cdz-stack-overlap) * -1);
  }

  :host([size='sm']) {
    --_cdz-stack-overlap: var(--cdz-avatar-stack-overlap-sm, 0.5rem);
    --_cdz-stack-size: 1.5rem;
  }

  :host,
  :host([size='md']) {
    --_cdz-stack-overlap: var(--cdz-avatar-stack-overlap-md, 0.75rem);
    --_cdz-stack-size: 2rem;
  }

  :host([size='lg']) {
    --_cdz-stack-overlap: var(--cdz-avatar-stack-overlap-lg, 1rem);
    --_cdz-stack-size: 3rem;
  }

  /* The z-index that orders these is set per item in the template, not
     here, because it depends on how many there are. See avatar-stack.ts
     for why later avatars sit on top. */
  li {
    position: relative;
    display: inline-flex;
    border-radius: 50%;
    box-shadow: 0 0 0 var(--cdz-avatar-stack-ring-width, 2px)
      var(--cdz-avatar-stack-ring-color, #fdf7f9);
  }

  .overflow {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: var(--_cdz-stack-size);
    height: var(--_cdz-stack-size);
    border-radius: 50%;
    background: var(--cdz-avatar-stack-color-overflow-background, #efe9ec);
    color: var(--cdz-avatar-stack-color-overflow-text, #2c2230);
    font-family: var(--cdz-avatar-stack-typography-overflow-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-weight: var(--cdz-avatar-stack-typography-overflow-font-weight, 500);
    font-size: calc(var(--_cdz-stack-size) * 0.375);
  }
`;
