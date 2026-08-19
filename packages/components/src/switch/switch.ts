import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { switchStyles } from './switch.styles.js';
import { warnIfLabelMissing } from '../shared/required-label.js';

/**
 * `<cdz-switch>` — a single labeled on/off toggle.
 *
 * ARIA pattern: a real native `<input type="checkbox">` with
 * `role="switch"` added, restyled as a track+thumb — not a `role="switch"`
 * div with hand-rolled keyboard handling. Same reasoning as
 * `<cdz-checkbox>`: the native element keeps Space-to-toggle and form
 * participation for free. The only thing `role="switch"` changes is what
 * assistive technology *announces* (on/off rather than checked/not
 * checked) — the browser still derives `aria-checked` from the input's
 * own `.checked` state automatically, same as it does for the native
 * `role="checkbox"` a plain checkbox already gets. No `indeterminate`
 * here, unlike `<cdz-checkbox>`: a switch is strictly binary, it has no
 * "partially on" concept to represent.
 *
 * The thumb is a sibling `<span>`, not a pseudo-element on the input —
 * same reason as `<cdz-checkbox>`'s mark (`::before`/`::after` don't
 * reliably render on replaced elements like `<input>`).
 *
 * Non-obvious finding worth recording: no single fixed thumb color passes
 * 3:1 contrast against every track color this component needs (off/on ×
 * light/dark is 4 combinations). White clears the two light-mode tracks
 * but fails both dark-mode ones; a fixed dark ink color is the reverse.
 * The fix wasn't a new token — it's `color.action.primary.text.default`,
 * the exact role `<cdz-checkbox>`'s mark already uses, which already
 * forks white/ink per mode for precisely this reason (see ADR-0002's
 * "vivid fill needs dark text" finding). Verified all four combinations
 * with real contrast math before relying on it, not assumed.
 *
 * Disabled uses native `disabled`, same reasoning as every other form
 * atom here: no "explain why this is unavailable" affordance to
 * preserve, and native `disabled` is what correctly excludes the value
 * from `FormData`.
 *
 * Same required-`label` enforcement as every other form atom — see
 * `../shared/required-label.ts`.
 */
export class CdzSwitch extends LitElement {
  static styles = switchStyles;

  static properties = {
    label: { type: String },
    checked: { type: Boolean, reflect: true },
    helperText: { type: String, attribute: 'helper-text' },
    errorMessage: { type: String, attribute: 'error-message' },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    name: { type: String },
    value: { type: String }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare label: string;
  declare checked: boolean;
  declare helperText: string;
  declare errorMessage: string;
  declare required: boolean;
  declare disabled: boolean;
  declare name: string;
  declare value: string;

  constructor() {
    super();
    this.label = '';
    this.checked = false;
    this.helperText = '';
    this.errorMessage = '';
    this.required = false;
    this.disabled = false;
    this.name = '';
    this.value = '';
  }

  // See ../shared/required-label.ts for what this checks and why.
  protected willUpdate(): void {
    warnIfLabelMissing('cdz-switch', this.label);
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
              id="switch"
              class="track"
              type="checkbox"
              role="switch"
              .checked=${this.checked}
              ?disabled=${this.disabled}
              ?required=${this.required}
              name=${ifDefined(this.name || undefined)}
              value=${ifDefined(this.value || undefined)}
              aria-invalid=${hasError ? 'true' : 'false'}
              aria-describedby=${ifDefined(describedBy)}
              @change=${this._handleChange}
            />
            <span class="thumb" aria-hidden="true"></span>
          </span>
          <label for="switch">
            ${this.label}${this.required ? html`<span aria-hidden="true"> *</span>` : nothing}
          </label>
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

customElements.define('cdz-switch', CdzSwitch);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-switch': CdzSwitch;
  }
}
