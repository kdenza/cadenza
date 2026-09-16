import { css } from 'lit';

// Same static-fallback convention as every other component: the literal
// after the comma matches the token's actual resolved value, so this
// renders sensibly even where @kdenza/tokens' CSS isn't loaded.
export const popoverStyles = css`
  :host {
    position: fixed;
    position-area: bottom span-right;
    margin: 0;
    box-sizing: border-box;
    max-height: var(--cdz-popover-sizing-max-height, 16rem);
    overflow-y: auto;
    padding: var(--cdz-popover-spacing-padding, 0.5rem);
    border-radius: var(--cdz-popover-radius, 0.375rem);
    border: var(--cdz-popover-border-width, 1px) solid
      var(--cdz-popover-color-border, #8a7c87);
    background-color: var(--cdz-popover-color-background, #faf4f6);
    box-shadow: var(--cdz-popover-shadow, 0 4px 16px rgba(44, 34, 48, 0.16));
  }

  /* The popover attribute's UA stylesheet already handles hidden <->
     shown (display: none until :popover-open); this only fixes the
     shown layout to a column stack for whatever gets slotted in --
     a listbox's options today, a menu's items later. */
  :host(:popover-open) {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  /* ADR-0025's mandatory counterpart, and the one component where it must
     come LAST rather than sit at the top of the file with everything
     else's. :host([hidden]) and :host(:popover-open) have identical
     specificity (0,2,0), so source order alone decides the winner.
     Placed in the conventional spot above, this rule parses fine, reads
     correctly and does nothing at all -- measured, not reasoned: an open
     popover carrying the hidden attribute still computed to display:
     flex.

     A popover is the only component here whose display is state-
     dependent, which is why it is the only one with an ordering
     constraint. The browser does honour hidden on a native [popover]
     element -- verified against a plain div, which stays display: none
     even through showPopover() -- so without this the component was
     overriding behaviour the platform had got right. */
  :host([hidden]) {
    display: none;
  }
`;
