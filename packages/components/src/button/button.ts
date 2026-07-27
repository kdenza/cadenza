import { LitElement, html } from 'lit';
import { buttonStyles } from './button.styles.js';

export type CdzButtonType = 'button' | 'submit' | 'reset';

/**
 * `<cdz-button>` — a single, primary-style action button.
 *
 * ARIA pattern: disabled state uses `aria-disabled="true"` on the internal
 * `<button>` instead of the native `disabled` attribute. Native `disabled`
 * removes the element from the tab order and the accessibility tree, so a
 * screen reader user has no way to discover that the action exists but is
 * currently unavailable. Per the WAI-ARIA Authoring Practices guidance on
 * disabled controls, keeping the element focusable and perceivable — while
 * blocking activation in script — is preferred whenever the control should
 * stay discoverable (e.g. so a consumer can pair it with a tooltip
 * explaining *why* it's disabled). Contrast on the disabled visual state is
 * not held to the AA 4.5:1 text ratio because WCAG 1.4.3 explicitly exempts
 * inactive/disabled UI components.
 */
export class CdzButton extends LitElement {
  static styles = buttonStyles;

  static properties = {
    disabled: { type: Boolean, reflect: true },
    type: { type: String }
  };

  // `declare` erases these to type-only annotations — no JS is emitted, so
  // they can't shadow the reactive accessors Lit installs on the prototype
  // from `static properties` above. Plain class fields (`disabled = false`)
  // would use [[Define]] semantics and silently break reactivity; see
  // https://lit.dev/msg/class-field-shadowing.
  declare disabled: boolean;
  declare type: CdzButtonType;

  constructor() {
    super();
    this.disabled = false;
    // Defaults to 'button' rather than the HTML default of 'submit': a
    // <button> nested in a <form> with no explicit type submits the form,
    // which is rarely what a consumer dropping in <cdz-button> expects.
    this.type = 'button';
  }

  private _handleClick(event: MouseEvent): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  render() {
    return html`
      <button
        type=${this.type}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        @click=${this._handleClick}
      >
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('cdz-button', CdzButton);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-button': CdzButton;
  }
}
