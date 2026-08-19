import { LitElement, html } from 'lit';
import { popoverStyles } from './popover.styles.js';

export type CdzPopoverType = 'auto' | 'manual';

let anchorNameCounter = 0;

/**
 * `<cdz-popover>` — a generic floating-panel primitive: trigger-anchored
 * positioning, native light-dismiss, and nothing else.
 *
 * Deliberately ARIA-agnostic: it sets no `role` of its own. A listbox
 * (`cdz-select`), a menu, a combobox — each needs different roles on the
 * trigger and on the slotted content, and baking one in here would make
 * this only work for whichever pattern came first. The consumer owns the
 * ARIA pattern; this owns making the panel show up in the right place and
 * go away at the right time.
 *
 * Built on the native `popover` attribute (`type`, default `"auto"`) —
 * that's what gives light-dismiss (click outside) and Escape-to-close for
 * free, with no listeners of our own. Verified directly in-browser that an
 * `auto` popover with nothing `autofocus` inside does *not* steal focus
 * from the trigger on open — required for the listbox-button ARIA pattern,
 * where real DOM focus has to stay on the trigger the whole time
 * (`aria-activedescendant` tracks the "active" option instead).
 *
 * Positioning is set imperatively via the `anchor` property (a reference
 * to the trigger element, not an attribute — it isn't serializable and the
 * trigger usually isn't even in this element's own tree). This wires CSS
 * Anchor Positioning (`anchor-name` / `position-anchor`) between the two
 * elements. This has to happen here, in this class's own code, rather than
 * in a `:host` rule in this component's stylesheet: `position-anchor`
 * resolves a *tree-scoped* name, and verified directly in-browser that a
 * name declared in cdz-popover's own shadow-root stylesheet does not
 * resolve when the anchor element lives in a different shadow root (e.g.
 * cdz-select's). Setting `anchor-name`/`position-anchor` as inline styles
 * via JS on the two actual elements works regardless of which class's code
 * set them, because tree scope is a DOM property of the element, not a
 * JS-authorship one — confirmed empirically before relying on it.
 *
 * Anchor Positioning isn't universal yet (effectively Chromium-only today,
 * same ceiling already documented for `cdz-select`'s open-popup styling).
 * Feature-detected via `CSS.supports('position-anchor', ...)`: where it's
 * missing, `show()` falls back to a one-time `getBoundingClientRect`-based
 * placement instead. That fallback does not track scroll/resize — a real,
 * documented scope limit, not an oversight (see ADR-0010).
 */
export class CdzPopover extends LitElement {
  static styles = popoverStyles;

  static properties = {
    type: { type: String },
    open: { type: Boolean, reflect: true }
  };

  declare type: CdzPopoverType;
  declare open: boolean;

  private _anchorEl: HTMLElement | null = null;
  private readonly _anchorName = `--cdz-popover-anchor-${++anchorNameCounter}`;
  private readonly _supportsAnchorPositioning =
    typeof CSS !== 'undefined' && CSS.supports('position-anchor', '--a');

  private readonly _handleNativeToggle = (event: Event): void => {
    this.open = (event as ToggleEvent).newState === 'open';
  };

  constructor() {
    super();
    this.type = 'auto';
    this.open = false;
  }

  connectedCallback(): void {
    super.connectedCallback();
    // Set synchronously here, not just in willUpdate(): a consumer can call
    // show() right after connecting this element, before Lit's first
    // (always-async) update cycle has run -- showPopover() throws if the
    // popover attribute isn't already in place by then.
    this.popover = this.type;
    this.addEventListener('toggle', this._handleNativeToggle);
  }

  disconnectedCallback(): void {
    this.removeEventListener('toggle', this._handleNativeToggle);
    super.disconnectedCallback();
  }

  protected willUpdate(): void {
    // The native `popover` IDL property, not a Lit-managed one — this is
    // what actually opts the element into the Popover API's behavior.
    this.popover = this.type;
  }

  /** The element this popover is positioned relative to (the trigger). */
  get anchor(): HTMLElement | null {
    return this._anchorEl;
  }

  set anchor(el: HTMLElement | null) {
    if (this._anchorEl && this._supportsAnchorPositioning) {
      this._anchorEl.style.removeProperty('anchor-name');
    }
    this._anchorEl = el;
    if (el && this._supportsAnchorPositioning) {
      el.style.setProperty('anchor-name', this._anchorName);
      this.style.setProperty('position-anchor', this._anchorName);
    }
  }

  show(): void {
    if (this.matches(':popover-open')) return;
    if (!this._supportsAnchorPositioning && this._anchorEl) {
      const rect = this._anchorEl.getBoundingClientRect();
      this.style.top = `${rect.bottom}px`;
      this.style.left = `${rect.left}px`;
    }
    this.showPopover();
    // Set directly rather than waiting on the native `toggle` event: that
    // event is dispatched as a separate queued task (verified in-browser),
    // so a caller reading `.open` right after show()/hide() would still
    // see the old value if this relied on the event alone. The listener
    // still matters for changes *we* didn't initiate (light-dismiss,
    // Escape, another exclusive popover taking over).
    this.open = true;
  }

  hide(): void {
    if (!this.matches(':popover-open')) return;
    this.hidePopover();
    this.open = false;
  }

  toggle(): void {
    if (this.matches(':popover-open')) this.hide();
    else this.show();
  }

  render() {
    return html`<slot></slot>`;
  }
}

customElements.define('cdz-popover', CdzPopover);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-popover': CdzPopover;
  }
}
