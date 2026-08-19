import { LitElement, html, svg, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { linkStyles } from './link.styles.js';
import { icons, ICON_GRID } from '../shared/icons.js';

/**
 * `<cdz-link>` — a navigational link.
 *
 * ARIA pattern: a real native `<a href>`, nothing more. Worth stating
 * because the common failure mode is the opposite — a `<span>` or
 * `<div>` with a click handler, which is not focusable, not in the
 * accessibility tree as a link, can't be opened in a new tab, and can't
 * be copied. `href` is therefore mandatory here: an `<a>` *without* it
 * is not a link at all (it gets no `link` role and drops out of the tab
 * order), so a missing `href` gets the same loud `console.error`
 * treatment that a missing `label` gets on every form atom.
 *
 * **No `disabled`** — deliberate, and a real divergence from the form
 * atoms. HTML has no disabled state for links: `aria-disabled` on an
 * `<a href>` still leaves it fully clickable, and removing `href` to
 * "disable" it silently destroys the link semantics described above.
 * A thing that can be unavailable is an *action*, not a destination —
 * use `<cdz-button disabled>` for that case.
 *
 * `target="_blank"` is treated as two separate obligations, both handled
 * automatically because both are easy to forget:
 *
 * 1. **Security**: `rel="noopener"` is merged into whatever `rel` the
 *    consumer passed. Modern browsers imply this for `target="_blank"`
 *    already, but setting it explicitly is auditable and still matters
 *    for older engines. `noreferrer` is deliberately *not* added — it
 *    also strips the `Referer` header, which is a privacy/analytics
 *    decision belonging to the consumer, not a security default.
 * 2. **Accessibility**: an unannounced new tab is a WCAG 3.2.5 problem —
 *    it changes context without warning, which is disorienting for
 *    screen-reader users and anyone who relies on the back button. A
 *    visually-hidden note (`newTabLabel`, translatable) plus a small
 *    visual icon covers both audiences. See WCAG technique G201.
 *
 * **No `:visited` styling**, and the reason is methodological rather
 * than aesthetic. Browsers deliberately lie about visited links to block
 * history sniffing: only a handful of properties can be styled, and
 * `getComputedStyle` reports the *unvisited* values regardless.
 * Confirmed directly — a `:visited` rule setting color, background and
 * font-weight on a link pointing at the current page reported the
 * unvisited color, ignored the font-weight entirely, and
 * `element.matches(':visited')` returned `false`. Every color decision
 * in this project is signed off against measured contrast, and that
 * measurement is impossible here by design. Rather than ship an
 * unverifiable color, this is left out and recorded in ADR-0015.
 *
 * Typography is inherited, not set — see `link.styles.ts`.
 */
export class CdzLink extends LitElement {
  static styles = linkStyles;

  static properties = {
    href: { type: String },
    target: { type: String },
    rel: { type: String },
    download: { type: String },
    newTabLabel: { type: String, attribute: 'new-tab-label' }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare href: string;
  declare target: string;
  declare rel: string;
  declare download: string | null;
  declare newTabLabel: string;

  constructor() {
    super();
    this.href = '';
    this.target = '';
    this.rel = '';
    // null rather than '' so that an explicit `download=""` (valueless
    // download, the common case) stays distinguishable from "not set".
    this.download = null;
    this.newTabLabel = '(abre en una pestaña nueva)';
  }

  // Mirrors warnIfLabelMissing's contract (console.error, never throw,
  // re-checked on every update so clearing a valid href later is caught
  // too). Deliberately *not* extracted into shared/ yet: that utility was
  // only pulled out once the same check appeared in a third component
  // (see ADR-0009), and this is the first non-label instance of the
  // pattern. Extract when a second one shows up, not before.
  protected willUpdate(): void {
    if (this.href.trim().length === 0) {
      console.error(
        '[cdz-link] "href" es obligatorio: un <a> sin href no es un enlace ' +
          '(no recibe foco ni rol de enlace). Si necesitas una acción ' +
          'deshabilitable, usa <cdz-button disabled> en su lugar.'
      );
    }
  }

  /**
   * Merges `noopener` into the consumer's `rel` when opening a new tab,
   * instead of overwriting it — a consumer asking for `nofollow` should
   * keep it and get the security default too.
   */
  private _resolvedRel(): string | undefined {
    const parts = this.rel.split(/\s+/).filter(Boolean);
    if (this.target === '_blank' && !parts.includes('noopener')) {
      parts.push('noopener');
    }
    return parts.length > 0 ? parts.join(' ') : undefined;
  }

  render() {
    const opensNewTab = this.target === '_blank';

    return html`
      <a
        href=${ifDefined(this.href || undefined)}
        target=${ifDefined(this.target || undefined)}
        rel=${ifDefined(this._resolvedRel())}
        download=${ifDefined(this.download ?? undefined)}
      >
        <slot></slot>${opensNewTab
          ? html`<span class="sr-only"> ${this.newTabLabel}</span>
              <svg
                class="external-icon"
                viewBox="0 0 ${ICON_GRID} ${ICON_GRID}"
                aria-hidden="true"
                focusable="false"
              >
                ${icons['external-link'].paths.map((d) => svg`<path d=${d} />`)}
              </svg>`
          : nothing}
      </a>
    `;
  }
}

customElements.define('cdz-link', CdzLink);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-link': CdzLink;
  }
}
