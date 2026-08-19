import { css } from 'lit';

// Same static-fallback convention as every other component.
export const avatarStyles = css`
  :host {
    display: inline-flex;
    --_cdz-avatar-size: var(--cdz-avatar-sizing-md, 2rem);
  }

  :host([size='sm']) {
    --_cdz-avatar-size: var(--cdz-avatar-sizing-sm, 1.5rem);
  }

  :host([size='lg']) {
    --_cdz-avatar-size: var(--cdz-avatar-sizing-lg, 3rem);
  }

  .avatar {
    position: relative;
    inline-size: var(--_cdz-avatar-size);
    block-size: var(--_cdz-avatar-size);
    border-radius: 50%;
    /* Clips the photo to the circle. Also why the image can be a plain
       <img> instead of a background-image: it stays a real element, so
       its load and error events are observable. */
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    /* An avatar in a flex row must never be squashed into an ellipse by a
       long name beside it. */
    flex: 0 0 auto;
    background-color: var(--cdz-avatar-color-background, #ece7ea);
    color: var(--cdz-avatar-color-foreground, #3a2f38);
  }

  /* The fallback is always rendered; the photo sits on top of it. So
     while the image is still loading there is something to look at, and
     nothing shifts when it arrives. */
  .initials {
    font-family: var(--cdz-avatar-typography-font-family, 'Source Sans 3', system-ui, sans-serif);
    font-weight: var(--cdz-avatar-typography-font-weight, 500);
    font-size: calc(var(--_cdz-avatar-size) * var(--cdz-avatar-initials-scale, 0.4));
    line-height: 1;
    /* Dragging a selection across a row of avatars shouldn't pick up
       stray letters that aren't really content. */
    user-select: none;
  }

  /* cdz-icon's size="inherit" resolves to 1em, so setting font-size here
     scales the icon through its public API instead of reaching into its
     private custom property. */
  .icon {
    display: flex;
    font-size: calc(var(--_cdz-avatar-size) * var(--cdz-avatar-icon-scale, 0.6));
  }

  img {
    position: absolute;
    inset: 0;
    inline-size: 100%;
    block-size: 100%;
    /* cover, never fill: a portrait that isn't square gets cropped to the
       circle rather than stretched. */
    object-fit: cover;
  }
`;
