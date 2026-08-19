import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { rangeStyles } from './range.styles.js';
import { warnIfLabelMissing } from '../shared/required-label.js';

/**
 * `<cdz-range>` — a labeled slider for picking a numeric value in a range.
 *
 * ARIA pattern: a real native `<input type="range">`, not a
 * `role="slider"` div with hand-rolled drag/keyboard handling. This is
 * the atom where that choice matters most of any built so far — a
 * correct custom slider needs arrow-key stepping, Home/End, Page Up/Down,
 * pointer drag *and* click-to-jump, all with correct `aria-valuenow`
 * updates, and the WAI-ARIA APG itself calls this one of the harder
 * widgets to reimplement correctly. The native element gets all of it
 * for free.
 *
 * The real cost of that choice: `<input type="range">` is the most
 * visually fragmented native control to restyle. Verified directly
 * in-browser (not assumed) that the standardized, unprefixed slider
 * pseudo-elements (`::slider-thumb`, `::slider-track`, `::slider-fill`)
 * aren't supported yet anywhere — `appearance: none` plus the classic
 * `::-webkit-slider-thumb` / `::-webkit-slider-runnable-track` and
 * `::-moz-range-thumb` / `::-moz-range-track` pairs are still required,
 * duplicated per engine. See `range.styles.ts`.
 *
 * The filled portion of the track is a gradient on the track
 * pseudo-element, driven by a `--cdz-range-fill-percent` custom property
 * set imperatively in `updated()` — neither engine exposes a shared
 * "filled track" pseudo-element (Firefox's `::-moz-range-progress` has no
 * WebKit equivalent), so computing one gradient stop position in JS and
 * sharing it between both engines' track rules is simpler than
 * maintaining two different filling mechanisms.
 *
 * The thumb color reuses `color.action.primary.text.default` — the exact
 * finding from `<cdz-switch>` (ADR-0012) applies unchanged here: the
 * thumb sits at the boundary between the fill and track colors and must
 * stay visible against *both*, in both color schemes, and those are the
 * same four colors already verified there (`color.form.border.default` /
 * `color.action.primary.background.default`, light and dark). No new
 * contrast math needed — this is the same four-way problem, solved by
 * the same existing token.
 *
 * The current numeric value is shown via a native `<output for>`, not a
 * plain `<span>` — it's the element HTML already has for exactly this
 * "result associated with a control" relationship, same instinct as
 * using `<input>`/`<select>`/`<textarea>` themselves everywhere else in
 * this project rather than reaching for a generic element first.
 *
 * No `required`, unlike every other form atom here — deliberate, not an
 * oversight: a range input always has *some* numeric value (it defaults
 * to the midpoint of min/max and clamps on every interaction), so there
 * is no empty state for "required" to guard against.
 *
 * Disabled uses native `disabled`, same reasoning as every other form
 * atom: no "explain why this is unavailable" affordance to preserve, and
 * native `disabled` is what correctly excludes the value from
 * `FormData`.
 *
 * Same required-`label` enforcement as every other form atom — see
 * `../shared/required-label.ts`.
 */
export class CdzRange extends LitElement {
  static styles = rangeStyles;

  static properties = {
    label: { type: String },
    value: { type: Number },
    min: { type: Number },
    max: { type: Number },
    step: { type: Number },
    helperText: { type: String, attribute: 'helper-text' },
    errorMessage: { type: String, attribute: 'error-message' },
    disabled: { type: Boolean, reflect: true },
    name: { type: String }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare label: string;
  declare value: number;
  declare min: number;
  declare max: number;
  declare step: number;
  declare helperText: string;
  declare errorMessage: string;
  declare disabled: boolean;
  declare name: string;

  constructor() {
    super();
    this.label = '';
    // Mirrors the native <input type="range"> defaults exactly (min 0,
    // max 100, step 1, value at the midpoint) so this component behaves
    // the same as a bare native range whenever a consumer doesn't
    // override these.
    this.value = 50;
    this.min = 0;
    this.max = 100;
    this.step = 1;
    this.helperText = '';
    this.errorMessage = '';
    this.disabled = false;
    this.name = '';
  }

  // See ../shared/required-label.ts for what this checks and why.
  protected willUpdate(): void {
    warnIfLabelMissing('cdz-range', this.label);
  }

  protected updated(changedProperties: PropertyValues<this>): void {
    if (changedProperties.has('value') || changedProperties.has('min') || changedProperties.has('max')) {
      const input = this.shadowRoot?.querySelector('input');
      if (input) {
        const range = this.max - this.min;
        const percent = range === 0 ? 0 : ((this.value - this.min) / range) * 100;
        input.style.setProperty('--cdz-range-fill-percent', `${percent}%`);
      }
    }
  }

  private _handleInput(event: InputEvent): void {
    const target = event.target as HTMLInputElement;
    this.value = Number(target.value);
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }

  private _handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = Number(target.value);
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  render() {
    const hasError = this.errorMessage.length > 0;
    const hasHelper = this.helperText.length > 0;
    const describedBy = hasError ? 'error-text' : hasHelper ? 'helper-text' : undefined;

    // min/max/step are bound before .value below, and that order matters:
    // lit-html applies bindings in template source order, and on this
    // element's first render its native defaults are min=0/max=100 until
    // those bindings run. Binding .value first would clamp it against
    // those defaults instead of the real ones whenever a consumer's max
    // differs from 100 -- found via a min=0/max=1000/value=1000 case,
    // which silently clamped to 100.
    return html`
      <div class="field">
        <div class="label-row">
          <label for="range">${this.label}</label>
          <output for="range">${this.value}</output>
        </div>
        <input
          id="range"
          type="range"
          min=${this.min}
          max=${this.max}
          step=${this.step}
          .value=${String(this.value)}
          ?disabled=${this.disabled}
          name=${ifDefined(this.name || undefined)}
          aria-invalid=${hasError ? 'true' : 'false'}
          aria-describedby=${ifDefined(describedBy)}
          @input=${this._handleInput}
          @change=${this._handleChange}
        />
        ${hasError
          ? html`<p id="error-text" class="caption error">${this.errorMessage}</p>`
          : hasHelper
            ? html`<p id="helper-text" class="caption helper">${this.helperText}</p>`
            : nothing}
      </div>
    `;
  }
}

customElements.define('cdz-range', CdzRange);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-range': CdzRange;
  }
}
