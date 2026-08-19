import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { progressStyles } from './progress.styles.js';
import { warnIfLabelMissing } from '../shared/required-label.js';

/**
 * `<cdz-progress>` — a determinate progress bar.
 *
 * ARIA pattern: a real native `<progress>`, which the platform maps to
 * `role="progressbar"` and whose `value`/`max` become
 * `aria-valuenow`/`aria-valuemin`/`aria-valuemax` without any attribute
 * being written by hand.
 *
 * **Why native here is a weaker argument than usual, and taken anyway.**
 * Every previous native-first decision in this project bought
 * *behaviour*: keyboard handling, form participation, validation. A
 * progress bar has no behaviour — it is a picture of a number. So the
 * honest comparison is "free, guaranteed-correct semantics" against
 * "three ARIA attributes on a `<div>`", which is a much narrower margin
 * than it was for `<cdz-range>`. Native won on two tiebreakers: semantics
 * the platform provides can't drift out of sync with the value the way
 * hand-written attributes can, and it keeps the styling cost identical
 * to the one already accepted for range rather than introducing a second
 * approach for the same visual problem.
 *
 * The styling cost is real: no standardised pseudo-elements exist yet
 * (verified — `::progress-bar` and `::progress-value` are both
 * unsupported), so the vendor-prefixed pairs are duplicated per engine.
 * See `progress.styles.ts`.
 *
 * **Determinate only.** A `<progress>` with no `value` is indeterminate,
 * and this component deliberately doesn't expose that: `appearance: none`
 * — which the custom styling requires — drops the native indeterminate
 * animation, so the result would be a bar that looks broken rather than
 * busy. Indeterminate work is `<cdz-spinner>`'s job (ADR-0018), which
 * also handles `prefers-reduced-motion` properly for the animation that
 * case needs.
 *
 * `valueText` sets `aria-valuetext` for when the bare number isn't the
 * useful thing to hear. A screen reader announcing "45" for a file upload
 * is technically accurate and practically useless; "45 de 100 MB" is what
 * the person needs. It's opt-in rather than generated, because only the
 * consumer knows what the number counts.
 *
 * Same required-`label` enforcement as every form atom — see
 * `../shared/required-label.ts`. A progress bar without a name announces
 * as a bare percentage with no indication of what is progressing.
 */
export class CdzProgress extends LitElement {
  static styles = progressStyles;

  static properties = {
    label: { type: String },
    value: { type: Number },
    max: { type: Number },
    valueText: { type: String, attribute: 'value-text' },
    showValue: { type: Boolean, attribute: 'show-value' }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare label: string;
  declare value: number;
  declare max: number;
  declare valueText: string;
  declare showValue: boolean;

  constructor() {
    super();
    this.label = '';
    this.value = 0;
    // Mirrors the native <progress> default so the component behaves like
    // a bare one whenever a consumer doesn't override it.
    this.max = 100;
    this.valueText = '';
    this.showValue = false;
  }

  // See ../shared/required-label.ts for what this checks and why.
  protected willUpdate(): void {
    warnIfLabelMissing('cdz-progress', this.label);
  }

  /** Rounded for display only — the underlying value is left untouched. */
  private _percent(): number {
    if (this.max <= 0) return 0;
    return Math.round((this.value / this.max) * 100);
  }

  render() {
    const hasValueText = this.valueText.trim().length > 0;

    return html`
      <div class="field">
        <div class="label-row">
          <label for="progress">${this.label}</label>
          ${this.showValue
            ? html`<span class="value" aria-hidden="true">
                ${hasValueText ? this.valueText : `${this._percent()}%`}
              </span>`
            : nothing}
        </div>
        <progress
          id="progress"
          max=${this.max}
          value=${this.value}
          aria-valuetext=${ifDefined(hasValueText ? this.valueText : undefined)}
        ></progress>
      </div>
    `;
  }
}

customElements.define('cdz-progress', CdzProgress);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-progress': CdzProgress;
  }
}
