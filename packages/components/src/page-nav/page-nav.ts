import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { pageNavStyles } from './page-nav.styles.js';
import '../icon/icon.js';
import '../button/button.js';
import type { CdzButton } from '../button/button.js';

// A module counter, matching cdz-tooltip. Math.random() was unique but not
// deterministic, which makes an id churn between otherwise identical
// renders -- hostile to snapshot tests and to any server-rendered markup
// having to match what the client produces.
let pageNavIdCounter = 0;

export interface CdzPageNavSection {
  /** The `id` of the heading this item links to. */
  id: string;
  /** Visible text for the item. */
  label: string;
}

/**
 * `<cdz-page-nav>` — a table of contents for the sections of the current
 * page.
 *
 * **The first molecule in the system.** Every previous component was an
 * atom: one control, one job. This one composes `cdz-button` and
 * `cdz-icon`, coordinates a list of links, and owns a piece of state
 * (which section is current) that none of its parts could own alone. See
 * ADR-0027.
 *
 * ARIA pattern: a `nav` landmark with an accessible name, plus the
 * Disclosure pattern for the narrow-screen toggle (`aria-expanded` +
 * `aria-controls`). Deliberately *not* the Menu pattern — `role="menu"`
 * is for application menus with roving focus and typeahead, and applying
 * it to a list of links makes screen readers announce a menu that does
 * not behave like one.
 *
 * **`aria-current="location"`, not `"page"`.** These links point at
 * sections of the document being read, not at other pages. `"page"` would
 * claim the reader is somewhere they are not.
 *
 * **It does not use `cdz-link`.** That atom is built for inline prose: it
 * inherits typography and carries a permanent underline, both correct
 * there and wrong here. Eighteen underlines stacked in a column is noise
 * rather than affordance — a list of links already reads as links from
 * its layout. Forcing one atom to serve both jobs would have meant
 * weakening the rule that makes it good at the first.
 *
 * **Current state is signalled three ways** — colour, weight and a
 * start-edge marker — because colour alone fails WCAG 1.4.1 and weight
 * alone is easy to miss in a dense list.
 *
 * The scroll spy resolves section ids through `getRootNode()` rather than
 * `document`, so it keeps working when this component is placed inside
 * another shadow root. `document.getElementById` would silently find
 * nothing there — the same tree-scoping that ADR-0020 ran into.
 */
export class CdzPageNav extends LitElement {
  static styles = pageNavStyles;

  static properties = {
    label: { type: String },
    sections: { type: Array },
    currentId: { type: String, attribute: 'current-id' },
    spy: { type: Boolean },
    toggleLabel: { type: String, attribute: 'toggle-label' },
    // `attribute: false` is explicit, not redundant: `state: true` implies
    // it at runtime, but the manifest analyzer's static-properties plugin
    // only looks for the literal flag. Verified by regenerating
    // custom-elements.json -- without it, `_expanded` was published as a
    // public attribute and the gallery drew a control for it.
    _expanded: { state: true, attribute: false }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare label: string;
  declare sections: CdzPageNavSection[];
  declare currentId: string;
  declare spy: boolean;
  declare toggleLabel: string;
  declare private _expanded: boolean;

  private _observer?: IntersectionObserver;
  private readonly _listId = `cdz-page-nav-${++pageNavIdCounter}`;

  constructor() {
    super();
    this.label = '';
    this.sections = [];
    this.currentId = '';
    this.spy = true;
    this.toggleLabel = 'Secciones';
    this._expanded = false;
  }

  protected willUpdate(): void {
    if (this.label.trim().length === 0) {
      console.error(
        '[cdz-page-nav] "label" is required: a nav landmark without an ' +
          'accessible name is indistinguishable from every other nav on the ' +
          'page. Pass it as a property or attribute, e.g. ' +
          '<cdz-page-nav label="Sections">.'
      );
    }
  }

  protected updated(changed: Map<string, unknown>): void {
    if (changed.has('sections') || changed.has('spy')) this._resetObserver();

    // aria-expanded and aria-controls used to sit on the <cdz-button>
    // host, which carries no role -- the element assistive technology
    // actually treats as the button is the <button> inside its shadow
    // root, and it got neither. The disclosure state never reached anyone.
    // The test asserted on the host, so it passed the whole time.
    //
    // aria-controls cannot be forwarded as an id: IDREFs resolve within
    // one tree scope and the list is in *this* shadow root (ADR-0020).
    // The element reference does cross, outward, which is why this is a
    // property assignment and not an attribute.
    const toggle = this.shadowRoot?.querySelector('cdz-button');
    const list = this.shadowRoot?.querySelector('ul');
    if (toggle && list) (toggle as CdzButton).controls = list;
  }

  // updated() rebuilds the observer only when `sections` or `spy` change,
  // so without this a re-parented nav loses its scroll spy for good: the
  // disconnect below is permanent and nothing ever calls _resetObserver()
  // again. Same lifecycle asymmetry as cdz-select's popover listener --
  // set up once in a first-render hook, torn down on every unmount.
  connectedCallback(): void {
    super.connectedCallback();
    if (this.hasUpdated) this._resetObserver();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
    // Cleared, not just disconnected: a dead instance left in the field
    // makes _resetObserver()'s own `this._observer?.disconnect()` look
    // like it did something on the next call.
    this._observer = undefined;
  }

  private _resetObserver(): void {
    this._observer?.disconnect();
    this._observer = undefined;
    if (!this.spy || this.sections.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') return;

    // getRootNode, not document: this component may live inside another
    // shadow root, where document.getElementById finds nothing and fails
    // silently.
    const root = this.getRootNode() as Document | ShadowRoot;

    this._observer = new IntersectionObserver(
      (entries) => {
        // The topmost intersecting section wins. Without this, scrolling
        // fast can leave a lower section marked current while an earlier
        // one fills the screen.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target.id) this.currentId = visible[0].target.id;
      },
      // Only the top portion of the viewport counts, so "current" means
      // the section being read rather than any section merely on screen.
      { rootMargin: '0px 0px -70% 0px' }
    );

    for (const section of this.sections) {
      const el = root.getElementById?.(section.id);
      if (el) this._observer.observe(el);
    }
  }

  private _toggle = (): void => {
    this._expanded = !this._expanded;
  };

  // Following a link on a narrow screen should collapse the list, or the
  // reader lands on the section with the menu still covering it.
  private _handleItemClick = (): void => {
    if (this._expanded) this._expanded = false;
  };

  render() {
    const name = this.label.trim();

    return html`
      <nav aria-label=${ifDefined(name.length > 0 ? name : undefined)}>
        ${this.sections.length > 0
          ? html`
              <cdz-button
                class="toggle"
                expanded=${this._expanded ? 'true' : 'false'}
                @click=${this._toggle}
              >
                <cdz-icon name=${this._expanded ? 'x' : 'menu'} size="sm"></cdz-icon>
                ${this.toggleLabel}
              </cdz-button>
            `
          : nothing}

        <ul id=${this._listId} ?hidden=${!this._expanded}>
          ${this.sections.map(
            (section) => html`
              <li>
                <a
                  href="#${section.id}"
                  aria-current=${ifDefined(
                    section.id === this.currentId ? 'location' : undefined
                  )}
                  @click=${this._handleItemClick}
                  >${section.label}</a
                >
              </li>
            `
          )}
        </ul>
      </nav>
    `;
  }
}

customElements.define('cdz-page-nav', CdzPageNav);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-page-nav': CdzPageNav;
  }
}
