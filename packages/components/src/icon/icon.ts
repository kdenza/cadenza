import { LitElement, html, svg, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { iconStyles } from './icon.styles.js';
import { icons, ICON_GRID, type CdzIconName } from '../shared/icons.js';

export type CdzIconSize = 'sm' | 'md' | 'lg' | 'inherit';

/**
 * `<cdz-icon>` — renders an icon from the shared registry.
 *
 * The registry (`../shared/icons.ts`) owns the geometry and the grid
 * rules; this component owns exactly three things: size, colour, and —
 * the one that actually matters — what the icon *means* to assistive
 * technology.
 *
 * **Decorative by default, meaningful on request.** This is the central
 * API decision, and it's deliberately asymmetric:
 *
 * - No `label` → the icon is decoration. It gets `aria-hidden="true"`
 *   and contributes nothing to the accessibility tree. This is right far
 *   more often than not: the chevron beside "País", the check inside a
 *   checkbox, the arrow on an external link all sit next to text that
 *   already says the same thing, and announcing them again is noise.
 * - `label` set → the icon is the *only* carrier of that meaning, so it
 *   gets `role="img"` and `aria-label`. The case this exists for is an
 *   icon-only control, where nothing else in the DOM says what it does.
 *
 * The default is the safe one on purpose. A decorative icon wrongly
 * announced is mildly annoying; a meaningful icon silently missing is a
 * control a screen-reader user cannot identify at all. Making the
 * meaningful case require an explicit, human-written string is also what
 * forces that string to exist — an API that guessed a label from the
 * icon's `name` would produce "external-link" read aloud, which is worse
 * than nothing.
 *
 * Colour is not a property. The SVG paints with `currentColor`, so an
 * icon takes the text colour of whatever it's placed in and follows
 * light/dark automatically. That's the concrete payoff of choosing SVG
 * over an icon font (ADR-0016) — a font could only ever have done this
 * for the whole glyph at once.
 *
 * An unknown `name` renders nothing and logs a loud error, same contract
 * as the missing-`label`/`href` checks elsewhere: silently rendering an
 * empty box would turn a typo into a layout mystery.
 */
export class CdzIcon extends LitElement {
  static styles = iconStyles;

  static properties = {
    name: { type: String },
    size: { type: String, reflect: true },
    label: { type: String }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare name: string;
  declare size: CdzIconSize;
  declare label: string;

  constructor() {
    super();
    this.name = '';
    this.size = 'md';
    this.label = '';
  }

  protected willUpdate(): void {
    if (this.name.length > 0 && !(this.name in icons)) {
      console.error(
        `[cdz-icon] No existe un ícono llamado "${this.name}" en el registro. ` +
          `Disponibles: ${Object.keys(icons).join(', ')}. ` +
          'Ver packages/components/src/shared/icons.ts.'
      );
    }
  }

  render() {
    const definition = icons[this.name as CdzIconName];
    if (!definition) return nothing;

    const isMeaningful = this.label.trim().length > 0;

    return html`
      <svg
        viewBox="0 0 ${ICON_GRID} ${ICON_GRID}"
        role=${ifDefined(isMeaningful ? 'img' : undefined)}
        aria-label=${ifDefined(isMeaningful ? this.label : undefined)}
        aria-hidden=${ifDefined(isMeaningful ? undefined : 'true')}
        focusable="false"
      >
        ${definition.paths.map((d) => svg`<path d=${d} />`)}
      </svg>
    `;
  }
}

customElements.define('cdz-icon', CdzIcon);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-icon': CdzIcon;
  }
}
