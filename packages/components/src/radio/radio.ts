import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { radioStyles } from './radio.styles.js';
import { warnIfLabelMissing } from '../shared/required-label.js';

/**
 * `<cdz-radio>` — a single labeled radio button.
 *
 * ARIA pattern: uses a real native `<input type="radio">`, restyled via
 * `appearance: none` — same reasoning as `<cdz-checkbox>`: native gets
 * keyboard/form/AT semantics for free instead of reimplementing
 * `role="radio"` by hand.
 *
 * Known limitation, documented rather than hidden: native radio grouping
 * (mutual exclusivity + arrow-key navigation between radios sharing a
 * `name`) only works within a single DOM tree. Each `<cdz-radio>` renders
 * its `<input>` inside its own shadow root, so two separate `<cdz-radio>`
 * instances given the same `name` do NOT form a native group — checking
 * one will not uncheck the other, and arrow keys won't move focus between
 * them (verified, not assumed, in radio.test.ts). This is a real,
 * documented Web Components + shadow DOM limitation, not an oversight.
 * Coordinating multiple radios (shared selection state, roving tabindex,
 * arrow-key handling) is exactly what a future `<cdz-radio-group>`
 * *molecule* is for — this atom is correct and accessible used standalone,
 * but isn't a substitute for that group component the moment more than
 * one option needs to be mutually exclusive.
 *
 * No `required` property, unlike `<cdz-input>`/`<cdz-checkbox>`:
 * "required" is meaningless for a single radio in isolation — it's a
 * property of the *group* ("you must pick one of these"), not of any one
 * option. That belongs on the future group molecule too.
 *
 * Same required-`label` enforcement as `<cdz-input>`/`<cdz-checkbox>` —
 * see `../shared/required-label.ts`.
 */
export class CdzRadio extends LitElement {
  static styles = radioStyles;

  static properties = {
    label: { type: String },
    checked: { type: Boolean, reflect: true },
    helperText: { type: String, attribute: 'helper-text' },
    errorMessage: { type: String, attribute: 'error-message' },
    disabled: { type: Boolean, reflect: true },
    name: { type: String },
    value: { type: String }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare label: string;
  declare checked: boolean;
  declare helperText: string;
  declare errorMessage: string;
  declare disabled: boolean;
  declare name: string;
  declare value: string;

  constructor() {
    super();
    this.label = '';
    this.checked = false;
    this.helperText = '';
    this.errorMessage = '';
    this.disabled = false;
    this.name = '';
    this.value = '';
  }

  // See ../shared/required-label.ts for what this checks and why.
  protected willUpdate(): void {
    warnIfLabelMissing('cdz-radio', this.label);
  }

  private _handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  render() {
    const hasError = this.errorMessage.length > 0;
    const hasHelper = this.helperText.length > 0;
    const describedBy = hasError ? 'error-text' : hasHelper ? 'helper-text' : undefined;

    return html`
      <div class="field">
        <span class="row">
          <span class="control-wrapper">
            <input
              id="radio"
              class="circle"
              type="radio"
              .checked=${this.checked}
              ?disabled=${this.disabled}
              name=${ifDefined(this.name || undefined)}
              value=${ifDefined(this.value || undefined)}
              aria-invalid=${hasError ? 'true' : 'false'}
              aria-describedby=${ifDefined(describedBy)}
              @change=${this._handleChange}
            />
            <span class="dot" aria-hidden="true"></span>
          </span>
          <label for="radio">${this.label}</label>
        </span>
        ${hasError
          ? html`<p id="error-text" class="caption error">${this.errorMessage}</p>`
          : hasHelper
            ? html`<p id="helper-text" class="caption helper">${this.helperText}</p>`
            : nothing}
      </div>
    `;
  }
}

customElements.define('cdz-radio', CdzRadio);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-radio': CdzRadio;
  }
}
