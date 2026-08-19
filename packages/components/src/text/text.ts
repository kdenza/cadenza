import { LitElement, html } from 'lit';
import { textStyles } from './text.styles.js';

export type CdzTextAs = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
export type CdzTextSize = 'heading-1' | 'heading-2' | 'heading-3' | 'body-lg' | 'body-md' | 'body-sm';

const DEFAULT_SIZE_FOR_TAG: Record<CdzTextAs, CdzTextSize> = {
  h1: 'heading-1',
  h2: 'heading-2',
  h3: 'heading-3',
  h4: 'heading-3',
  h5: 'heading-3',
  h6: 'heading-3',
  p: 'body-md',
  span: 'body-md'
};

/**
 * `<cdz-text>` — renders slotted content in one of a fixed set of document
 * tags (`as`), styled by an independent visual size (`size`).
 *
 * Accessibility pattern: exists to make it structurally hard to pick an
 * HTML tag by how it looks instead of what it means. Without this split,
 * the common failure is reaching for `<h4>` because "it looks small" when
 * the document's actual heading order calls for `<h2>` — which breaks
 * screen reader heading navigation (WCAG 1.3.1, 2.4.6: users jump between
 * headings expecting a logical h1→h2→h3 order, not one dictated by how
 * each happens to look). `as` and `size` are independent on purpose:
 * `<cdz-text as="h2" size="body-md">` is exactly the point — a real h2
 * for document structure, styled quietly.
 *
 * `size` defaults from `as` when omitted (h1 → heading-1, p → body-md,
 * h4-h6 all fall back to heading-3 rather than getting their own visual
 * step) — see `DEFAULT_SIZE_FOR_TAG`. Either can still be set
 * independently.
 *
 * What this does *not* do: validate overall document heading order (no
 * skipping h1 to h3, exactly one h1 per page, etc.). A single, isolated
 * component has no visibility into sibling/ancestor headings elsewhere on
 * the page — getting the *sequence* right across a whole document is
 * still the author's job.
 *
 * Renders a different tag per `as` value via a manual switch rather than
 * `lit/static-html.js`'s dynamic-tag support: Lit's regular `html` tagged
 * template can't parameterize a tag name directly, and a plain switch
 * keeps every branch trivially readable without pulling in another Lit
 * sub-module for a one-component need.
 */
export class CdzText extends LitElement {
  static styles = textStyles;

  static properties = {
    as: { type: String },
    size: { type: String }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare as: CdzTextAs;
  declare size: CdzTextSize | '';

  constructor() {
    super();
    this.as = 'p';
    this.size = '';
  }

  private get _effectiveSize(): CdzTextSize {
    return this.size || DEFAULT_SIZE_FOR_TAG[this.as];
  }

  render() {
    const cls = `text size-${this._effectiveSize}`;
    switch (this.as) {
      case 'h1':
        return html`<h1 class=${cls}><slot></slot></h1>`;
      case 'h2':
        return html`<h2 class=${cls}><slot></slot></h2>`;
      case 'h3':
        return html`<h3 class=${cls}><slot></slot></h3>`;
      case 'h4':
        return html`<h4 class=${cls}><slot></slot></h4>`;
      case 'h5':
        return html`<h5 class=${cls}><slot></slot></h5>`;
      case 'h6':
        return html`<h6 class=${cls}><slot></slot></h6>`;
      case 'span':
        return html`<span class=${cls}><slot></slot></span>`;
      case 'p':
      default:
        return html`<p class=${cls}><slot></slot></p>`;
    }
  }
}

customElements.define('cdz-text', CdzText);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-text': CdzText;
  }
}
