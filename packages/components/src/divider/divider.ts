import { LitElement, html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { dividerStyles } from './divider.styles.js';

export type CdzDividerOrientation = 'horizontal' | 'vertical';

/**
 * `<cdz-divider>` — a rule between things.
 *
 * Renders a real `<hr>`, whose browser defaults (8px block margins, an
 * `inset` border, zero height) are reset in `divider.styles.ts`.
 *
 * **Decorative by default, semantic on request** — the same asymmetry
 * `<cdz-icon>` uses, but reached from the opposite direction, which is
 * worth spelling out because the two look contradictory next to each
 * other.
 *
 * `<hr>` means "a paragraph-level thematic break", and the platform maps
 * it to `role="separator"`. Most rules in an interface are not thematic
 * breaks: the line between rows of a list, or inside a card, is grouping
 * furniture. A screen reader announcing "separator" once per row turns
 * a list into noise, and the cost compounds with repetition — which
 * dividers do more than any other atom here.
 *
 * So the default carries `role="none"`, and `semantic` opts back in for
 * the genuine case: a real change of subject between sections. The
 * failure modes are asymmetric in the useful direction. A decorative
 * divider wrongly announced is repeated noise; a semantic one wrongly
 * silent costs a structural hint, while every word of the content
 * remains present and readable.
 *
 * (For `<cdz-icon>` the calculus ran the other way — a meaningful icon
 * silently missing leaves a control nobody can identify — so it lands on
 * the same default for a different reason. The rule underneath both is
 * "make the quieter option the default", not "copy the neighbour".)
 *
 * `orientation="vertical"` also sets `aria-orientation` when semantic,
 * since a separator's orientation is part of what it conveys. A vertical
 * divider needs a height from somewhere: inside a flex row it stretches
 * to its siblings automatically, and anywhere else the consumer sets one.
 *
 * No outer margin, deliberately. Spacing between a divider and what
 * surrounds it belongs to the layout that owns both, not to the divider
 * — the same reason no other atom here sets margins on itself.
 */
export class CdzDivider extends LitElement {
  static styles = dividerStyles;

  static properties = {
    orientation: { type: String, reflect: true },
    semantic: { type: Boolean, reflect: true }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare orientation: CdzDividerOrientation;
  declare semantic: boolean;

  constructor() {
    super();
    this.orientation = 'horizontal';
    this.semantic = false;
  }

  render() {
    const isVertical = this.orientation === 'vertical';

    return html`
      <hr
        role=${ifDefined(this.semantic ? undefined : 'none')}
        aria-orientation=${ifDefined(this.semantic && isVertical ? 'vertical' : undefined)}
      />
    `;
  }
}

customElements.define('cdz-divider', CdzDivider);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-divider': CdzDivider;
  }
}
