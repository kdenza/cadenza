import { LitElement, html, svg, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { logoStyles } from './logo.styles.js';

export type CdzLogoVariant = 'color' | 'mono' | 'outline';
export type CdzLogoSize = 'sm' | 'md' | 'lg';
export type CdzLogoOrientation = 'horizontal' | 'vertical';

/**
 * Five petals around (0,0), each a closed path of three cubics, rotated
 * into place -- the tip is its own segment so it comes out blunt and
 * round, the way the source drawing has it; two curves meeting at a point
 * would make a blade pointed at both ends. Angles are 0/52/138/224/306°,
 * deliberately uneven rather than five 72° steps -- that asymmetry is the
 * drawing's character, not an artefact to clean up. `role` names the
 * semantic colour slot (see `logo.styles.ts` and this component's ADR),
 * not the literal hue: `secondary` is reused at 52° and 306° on purpose.
 *
 * Geometry is the vectorised redraw in
 * `design_handoff_cadenza_logo/reference/Logo.reference.txt` (`PETALS`) --
 * no vector original exists, so this traces the 512px PNG the brand was
 * drawn in.
 */
const PETALS: ReadonlyArray<{ angle: number; d: string; role: string }> = [
  {
    angle: 0,
    d: 'M0 0C-11.2 -57 -12.9 -138.8 -6.2 -170.9C-2.5 -185.1 2.5 -185.1 6.2 -170.9C12.9 -138.8 11.2 -57 0 0Z',
    role: 'petal-primary'
  },
  {
    angle: 52,
    d: 'M0 0C-35.6 -46 -41 -112.1 -19.6 -138C-7.8 -149.5 7.8 -149.5 19.6 -138C41 -112.1 35.6 -46 0 0Z',
    role: 'petal-secondary'
  },
  {
    angle: 138,
    d: 'M0 0C-33 -46.4 -37.9 -113.2 -18.2 -139.3C-7.3 -150.9 7.3 -150.9 18.2 -139.3C37.9 -113.2 33 -46.4 0 0Z',
    role: 'petal-tertiary'
  },
  {
    angle: 224,
    d: 'M0 0C-31 -48.7 -35.7 -118.6 -17.1 -146C-6.8 -158.2 6.8 -158.2 17.1 -146C35.7 -118.6 31 -48.7 0 0Z',
    role: 'petal-accent'
  },
  {
    angle: 306,
    d: 'M0 0C-37 -45.1 -42.5 -110 -20.3 -135.4C-8.1 -146.7 8.1 -146.7 20.3 -135.4C42.5 -110 37 -45.1 0 0Z',
    role: 'petal-secondary'
  }
];

/** The mark's own bounds, not the source PNG's 512 square -- see the ADR. */
const VIEW_BOX = '-154.1 -186 307.6 307.6';

/** Two concentric circles, same viewBox, used below `REDUCED_BELOW`. */
const HALO = { cx: -0.3, cy: -32.2, outer: 129.2, inner: 59.4 };

/**
 * The switch to the reduced mark is made on *painted pixels*, not on the
 * size name -- five petals and a centre stop resolving into a flower
 * below this many pixels. Only `sm` falls under it today; the rule is the
 * threshold, not which name happens to be small right now.
 */
const REDUCED_BELOW = 28;

/** Nominal painted size per `size`, in CSS pixels at the root font size. */
const SIZES: Record<CdzLogoSize, number> = { sm: 20, md: 32, lg: 44 };

/**
 * `<cdz-logo>` -- the jacaranda mark, with an optional "Cadenza" wordmark.
 *
 * **Brand colour does not fork by mode.** This is the one place in
 * Cadenza where a colour ignores the light/dark split that every semantic
 * role otherwise follows (ADR-0002). To keep the "never skip the semantic
 * tier" rule intact anyway, the five petal/centre/halo colours live in a
 * `color.brand.mark.*` semantic group that is defined identically in
 * `color.light.tokens.json` and `color.dark.tokens.json` -- same global
 * token on both sides, so the generated custom property happens to carry
 * the same value in both files rather than the component reaching past
 * the semantic tier for a global one. See this component's ADR.
 *
 * **The reduced mark is a genuinely different drawing, not a scaled-down
 * one.** Below `REDUCED_BELOW` painted pixels the five petals and the
 * centre stop resolving into a flower, so `sm` renders two concentric
 * circles (a blue centre, a lilac halo) instead. The swap is keyed off
 * the *size name's* nominal pixel value, matching the design reference --
 * not off a measured box, which would need a layout pass this component
 * has no reason to force.
 *
 * **Accessibility mirrors `cdz-avatar`'s split, not `cdz-icon`'s.** The
 * role/label live on an inner `<span>` in the shadow root (`.logo`), not
 * reflected onto the host, because that is the element actually carrying
 * the accessible name. The inner `<svg>` is always `aria-hidden` and
 * `focusable="false"`: with a wordmark, the visible text already says
 * "Cadenza" and exposing the mark too would announce it twice; without
 * one, the `.logo` wrapper itself carries `role="img"` and the label, so
 * the svg inside it would be a redundant nested `img`. `decorative`
 * silences the whole thing, for a header where an `<h1>` already says the
 * name.
 */
export class CdzLogo extends LitElement {
  static styles = logoStyles;

  static properties = {
    variant: { type: String, reflect: true },
    size: { type: String, reflect: true },
    withWordmark: { type: Boolean, attribute: 'with-wordmark' },
    orientation: { type: String },
    label: { type: String },
    decorative: { type: Boolean }
  };

  // `declare` -- see button.ts for why these can't be plain class fields.
  declare variant: CdzLogoVariant;
  declare size: CdzLogoSize;
  declare withWordmark: boolean;
  declare orientation: CdzLogoOrientation;
  declare label: string;
  declare decorative: boolean;

  constructor() {
    super();
    this.variant = 'color';
    this.size = 'md';
    this.withWordmark = false;
    this.orientation = 'horizontal';
    this.label = 'Cadenza';
    this.decorative = false;
  }

  render() {
    const reduced = (SIZES[this.size] ?? SIZES.md) < REDUCED_BELOW;

    // The wordmark already says the name, so the mark goes silent rather
    // than announcing "Cadenza Cadenza".
    const silent = this.decorative || this.withWordmark;
    const isMeaningful = !silent;
    const label = this.label;

    const wrapperClass =
      `logo${this.withWordmark ? ' with-wordmark' : ''}` +
      ` orientation-${this.orientation}`;

    return html`
      <span
        class=${wrapperClass}
        role=${ifDefined(isMeaningful ? 'img' : undefined)}
        aria-label=${ifDefined(isMeaningful ? label : undefined)}
        aria-hidden=${ifDefined(this.decorative ? 'true' : undefined)}
      >
        <svg viewBox=${VIEW_BOX} aria-hidden="true" focusable="false">
          ${reduced
            ? html`
                <circle class="halo" cx=${HALO.cx} cy=${HALO.cy} r=${HALO.outer}></circle>
                <circle class="center" cx=${HALO.cx} cy=${HALO.cy} r=${HALO.inner}></circle>
              `
            : html`
                ${PETALS.map(
                  (p) => svg`<path class=${p.role} d=${p.d} transform="rotate(${p.angle})"></path>`
                )}
                <circle class="center" r="31"></circle>
              `}
        </svg>
        ${this.withWordmark ? html`<span class="wordmark">${label}</span>` : nothing}
      </span>
    `;
  }
}

customElements.define('cdz-logo', CdzLogo);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-logo': CdzLogo;
  }
}
