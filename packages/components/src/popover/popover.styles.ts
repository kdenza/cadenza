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
`;
