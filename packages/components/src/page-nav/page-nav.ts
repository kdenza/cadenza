import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { pageNavStyles } from './page-nav.styles.js';
import '../icon/icon.js';
import '../button/button.js';

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
    _expanded: { state: true }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare label: string;
  declare sections: CdzPageNavSection[];
  declare currentId: string;
  declare spy: boolean;
  declare toggleLabel: string;
  declare private _expanded: boolean;

  private _observer?: IntersectionObserver;
  private readonly _listId = `cdz-page-nav-${Math.random().toString(36).slice(2, 9)}`;

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
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observer?.disconnect();
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
                aria-expanded=${this._expanded ? 'true' : 'false'}
                aria-controls=${this._listId}
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
