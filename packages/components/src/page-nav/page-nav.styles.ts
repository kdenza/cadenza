import { css } from 'lit';

// Same static-fallback convention as every other component.
export const pageNavStyles = css`
  :host {
    display: block;
  }

  /* The mandatory counterpart to any :host that sets display -- see
     ADR-0025. */
  :host([hidden]) {
    display: none;
  }

  /* The disclosure button only exists below the breakpoint. Above it the
     list is always visible, so a control that toggles it would be a
     control with nothing to do. It is removed from the layout entirely
     rather than visually hidden, so it leaves the tab order too. */
  .toggle {
    display: flex;
    align-items: center;
    gap: var(--cdz-page-nav-spacing-gap, 2px);
    width: 100%;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--cdz-page-nav-spacing-gap, 2px);
  }

  /* ADR-0025 again, and this time not on the host. Giving any element a
     display rule overrides the browser's [hidden] { display: none },
     because author styles beat UA styles wherever they collide. The rule
     is broader than that ADR stated: it applies to every element you
     style, not just to :host.
     Caught by the disclosure appearing to do nothing -- aria-expanded
     said false while the list stayed on screen. */
  ul[hidden] {
    display: none;
  }

  a {
    display: block;
    padding: var(--cdz-page-nav-spacing-item-block, 0.5rem)
      var(--cdz-page-nav-spacing-item-inline, 0.75rem);
    border-radius: var(--cdz-page-nav-radius, 0.375rem);
    /* No permanent underline here, unlike cdz-link: a list of links reads
       as a list from its layout, and eighteen underlines in a column is
       noise rather than affordance. See ADR-0027. */
    text-decoration: none;
    color: var(--cdz-page-nav-color-item, #2c2230);
    font-family: var(--cdz-page-nav-typography-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-size: var(--cdz-page-nav-typography-font-size, 0.875rem);
    /* The marker lives on the inline-start border so the item does not
       shift when it becomes current -- a transparent border of the same
       width is always there. */
    border-inline-start: var(--cdz-page-nav-marker-width, 2px) solid transparent;
  }

  a:hover {
    text-decoration: underline;
  }

  a:focus-visible {
    outline: 2px solid var(--cdz-page-nav-color-marker, #7a5197);
    outline-offset: 2px;
  }

  /* Current is expressed three ways on purpose: colour, weight and the
     marker. Colour alone would fail WCAG 1.4.1, and weight alone is easy
     to miss in a dense list. */
  a[aria-current='location'] {
    color: var(--cdz-page-nav-color-item-current, #7a5197);
    font-weight: var(--cdz-page-nav-typography-font-weight-current, 500);
    border-inline-start-color: var(--cdz-page-nav-color-marker, #7a5197);
  }

  @media (min-width: 48rem) {
    .toggle {
      display: none;
    }

    /* Above the breakpoint the list is unconditionally visible, whatever
       the disclosure state happens to be. Without this, resizing a window
       while collapsed would leave a desktop layout with no navigation and
       no button to bring it back. */
    ul[hidden] {
      display: flex;
    }
  }
`;
