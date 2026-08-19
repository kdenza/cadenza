import { LitElement, html } from 'lit';
import { spinnerStyles } from './spinner.styles.js';
import { ICON_GRID } from '../shared/icons.js';

export type CdzSpinnerSize = 'sm' | 'md' | 'lg' | 'inherit';

/**
 * `<cdz-spinner>` — an indeterminate loading indicator.
 *
 * **This one is a live region, and `<cdz-badge>` deliberately is not.**
 * The two decisions are opposites for a principled reason. A badge is
 * *content*: it's present when the page renders, and wrapping it in
 * `role="status"` would make every badge interrupt whatever a
 * screen-reader user is reading. A spinner is an *event*: it appears
 * because something started, which is exactly the case live regions
 * exist for. So this renders `role="status"` (implicitly polite) around
 * a visually-hidden label.
 *
 * "Polite" matters — an assertive region would cut off whatever is being
 * read, and "something is loading" never justifies that.
 *
 * The SVG is `aria-hidden`: the label carries the meaning, and a
 * decorative ring announced alongside it would just be noise. The label
 * is translatable (`label`), same as `cdz-file-input`'s trigger text and
 * `cdz-link`'s new-tab note — the application owns its copy.
 *
 * **Reduced motion is handled, not ignored.** Rotation is a classic
 * vestibular trigger, so under `prefers-reduced-motion: reduce` the spin
 * is replaced by a slow opacity pulse rather than merely slowed. Two
 * things follow from replacing instead of stopping: a frozen ring is
 * indistinguishable from a broken one, and the component's entire job is
 * saying "still working". Opacity changes don't move anything across the
 * screen, which is why the guidance targets motion rather than animation
 * in general. See `spinner.styles.ts`.
 *
 * Geometry reuses the icon system's grid — a radius-9 circle on the same
 * 24 unit canvas as `info`/`alert-circle` (ADR-0016) — so a spinner
 * swapped in where a status icon was doesn't change size or weight. The
 * stroke is slightly heavier than an icon's (2.5 vs 2) because a thin
 * moving arc reads as flicker rather than as a deliberate indicator.
 * `pathLength="100"` normalises the circumference so the dash array is
 * readable as a percentage instead of a computed decimal.
 *
 * **Out of scope, on purpose:** no appearance delay. A spinner that
 * flashes for a 60ms request is worse than none, but the fix belongs to
 * whoever knows how long the operation takes, not to the atom. And
 * nothing announces *completion* — removing the spinner is silent, so a
 * consumer whose flow needs "listo" has to say so itself.
 */
export class CdzSpinner extends LitElement {
  static styles = spinnerStyles;

  static properties = {
    size: { type: String, reflect: true },
    label: { type: String }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare size: CdzSpinnerSize;
  declare label: string;

  constructor() {
    super();
    this.size = 'md';
    this.label = 'Cargando…';
  }

  render() {
    const center = ICON_GRID / 2;
    const radius = 9;

    return html`
      <div role="status">
        <svg viewBox="0 0 ${ICON_GRID} ${ICON_GRID}" aria-hidden="true" focusable="false">
          <circle class="track" cx=${center} cy=${center} r=${radius}></circle>
          <circle
            class="arc"
            cx=${center}
            cy=${center}
            r=${radius}
            pathLength="100"
            stroke-dasharray="25 75"
          ></circle>
        </svg>
        <span class="label">${this.label}</span>
      </div>
    `;
  }
}

customElements.define('cdz-spinner', CdzSpinner);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-spinner': CdzSpinner;
  }
}
