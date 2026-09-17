import { LitElement, html, nothing } from 'lit';
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
 *
 * ## Disclosure support (`expanded` / `controls`)
 *
 * A button that shows and hides something needs `aria-expanded` — and it
 * needs it on the element that actually carries `role="button"`, which is
 * the `<button>` in here, not this host. A consumer setting
 * `aria-expanded` on `<cdz-button>` is decorating a role-less element and
 * the state never reaches assistive technology. `cdz-page-nav` did
 * exactly that, and its test asserted on the host, so it passed.
 *
 * `controls` is an **element reference**, not an id, and that is the
 * interesting half. `aria-controls` resolves IDREFs within a single tree
 * scope; the element being controlled lives in the consumer's shadow
 * root, so an id forwarded in here could never resolve — ADR-0020's
 * tree-scoping finding again. `ariaControlsElements` does work, in the
 * outward direction only. Measured, both ways:
 *
 * - our shadow root → the consumer's shadow root: reads back length 1.
 * - light DOM → a shadow root: reads back length 0, silently, exactly as
 *   ADR-0020 recorded for `ariaDescribedByElements`.
 *
 * Which is what lets this stay a composed atom rather than forcing
 * `cdz-page-nav` to hand-roll its own button: the platform relation a
 * shadow root breaks for IDREFs is restorable with element references.
 */
export class CdzButton extends LitElement {
  static styles = buttonStyles;

  static properties = {
    disabled: { type: Boolean, reflect: true },
    type: { type: String },
    // A string rather than a boolean on purpose. `aria-expanded` has three
    // meaningful states -- expanded, collapsed, and *not a disclosure
    // control at all* -- and a boolean attribute cannot express the third:
    // with Lit's Boolean converter `expanded="false"` would read as true.
    // These are aria-expanded's own values, which also makes the intent
    // obvious at the call site.
    // Not reflected: the constructor default is '' and Lit would write it
    // back on first update, putting a disclosure-shaped expanded="" on
    // every button in the system. Nothing styles :host([expanded]).
    expanded: { type: String },
    // Element reference, never an id -- see the class comment.
    controls: { attribute: false }
  };

  // `declare` erases these to type-only annotations — no JS is emitted, so
  // they can't shadow the reactive accessors Lit installs on the prototype
  // from `static properties` above. Plain class fields (`disabled = false`)
  // would use [[Define]] semantics and silently break reactivity; see
  // https://lit.dev/msg/class-field-shadowing.
  declare disabled: boolean;
  declare type: CdzButtonType;
  declare expanded: 'true' | 'false' | '';
  declare controls: HTMLElement | null;

  protected willUpdate(): void {
    // A bare `expanded` and an absent one both arrive as '', so the
    // attribute itself is what tells them apart: present-and-empty is the
    // consumer writing the natural HTML spelling and getting silence.
    const bareAttribute = this.getAttribute('expanded') === '';
    const invalidValue =
      this.expanded !== '' && this.expanded !== 'true' && this.expanded !== 'false';
    if (bareAttribute || invalidValue) {
      // Loud rather than quiet, the same contract as every other misused
      // prop here (ADR-0003). Two ways to get this wrong, and both used to
      // pass silently: a bare `expanded` parses as '', which is the
      // "not a disclosure" sentinel, so the state reached nobody -- the
      // exact outcome this property was added to fix in cdz-page-nav,
      // by a different route. And expanded="yes" reached aria-expanded
      // unvalidated, which is invalid ARIA: assistive technology treats it
      // as absent and axe flags it.
      console.error(
        `[cdz-button] "expanded" must be "true", "false", or absent; received ` +
          `${JSON.stringify(this.expanded)}. Note that a bare \`expanded\` attribute ` +
          `parses as "" — write expanded="true".`
      );
    }
  }

  constructor() {
    super();
    this.disabled = false;
    // Absent by default: aria-expanded on a control that expands nothing
    // announces a disclosure that does not exist.
    this.expanded = '';
    this.controls = null;
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

  protected updated(): void {
    const button = this.shadowRoot?.querySelector('button');
    if (!button) return;
    // Assigned imperatively because it is an element reference, which no
    // attribute can carry. Not yet in the DOM lib typings, hence the cast.
    const withAria = button as HTMLButtonElement & {
      ariaControlsElements?: readonly Element[] | null;
    };
    if ('ariaControlsElements' in button) {
      withAria.ariaControlsElements = this.controls ? [this.controls] : [];
    }
  }

  render() {
    return html`
      <button
        type=${this.type}
        aria-disabled=${this.disabled ? 'true' : 'false'}
        aria-expanded=${this.expanded === 'true' || this.expanded === 'false'
          ? this.expanded
          : nothing}
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
