import { css } from 'lit';

// Same static-fallback convention as every other component.
export const dividerStyles = css`
  :host {
    display: block;
  }

  /* A vertical divider only has a height if something gives it one.
     align-self: stretch makes it match its siblings inside a flex row,
     which is where a vertical divider is nearly always used; anywhere
     else the consumer sets a height. */
  :host([orientation='vertical']) {
    display: inline-block;
    align-self: stretch;
  }

  /* The browser's own <hr> comes with 8px block margins, an inset
     border and zero height — all of it reset here, because a design
     system's divider should look the same in every context. */
  hr {
    margin: 0;
    border: none;
    background-color: var(--cdz-divider-color, #8a7c87);
  }

  :host(:not([orientation='vertical'])) hr {
    width: 100%;
    height: var(--cdz-divider-thickness, 1px);
  }

  :host([orientation='vertical']) hr {
    width: var(--cdz-divider-thickness, 1px);
    height: 100%;
    /* Without this a vertical divider collapses in a flex row that has
       no explicit height on its children. */
    min-height: 1em;
  }
`;
