import { LitElement, html, nothing, type PropertyValues } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { checkboxStyles } from './checkbox.styles.js';

/**
 * `<cdz-checkbox>` — a single labeled checkbox.
 *
 * ARIA pattern: uses a real native `<input type="checkbox">` restyled via
 * `appearance: none`, not a `role="checkbox"` div with hand-rolled
 * keyboard handling. The native element keeps every platform behavior for
 * free — Space to toggle, form participation, and correct
 * `aria-checked`/`aria-checked="mixed"` computation — which a custom
 * role-based implementation would have to reimplement and would be easy
 * to get subtly wrong.
 *
 * `indeterminate` has no HTML attribute equivalent — it's a JS-only DOM
 * property — so it can't be set through a declarative template
 * attribute/property binding the way `checked` can. It's applied
 * imperatively in `updated()`, after the native `<input>` exists in the
 * DOM. Checking or unchecking always clears it, matching native checkbox
 * behavior.
 *
 * Disabled uses native `disabled`, same reasoning as `<cdz-input>`: no
 * "explain why this is unavailable" affordance to preserve, and native
 * `disabled` is what correctly excludes the value from `FormData`.
 *
 * Same required-`label` enforcement as `<cdz-input>` (see its class
 * comment for why: `console.error`, not throwing).
 */
export class CdzCheckbox extends LitElement {
  static styles = checkboxStyles;

  static properties = {
    label: { type: String },
    checked: { type: Boolean, reflect: true },
    indeterminate: { type: Boolean },
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
  declare indeterminate: boolean;
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
    this.indeterminate = false;
    this.helperText = '';
    this.errorMessage = '';
    this.required = false;
    this.disabled = false;
    this.name = '';
    this.value = '';
  }

  protected willUpdate(): void {
    if (this.label.trim().length === 0) {
      console.error(
        '[cdz-checkbox] "label" es obligatorio: un checkbox sin label no es accesible. ' +
          'Pásalo como propiedad o atributo, ej. <cdz-checkbox label="Acepto los términos">.'
      );
    }
  }

  protected updated(changedProperties: PropertyValues<this>): void {
    if (changedProperties.has('indeterminate')) {
      const input = this.shadowRoot?.querySelector('input');
      if (input) {
        input.indeterminate = this.indeterminate;
        input.classList.toggle('is-indeterminate', this.indeterminate);
      }
    }
  }

  private _handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.checked = target.checked;
    // Native checkboxes always resolve to a determinate state on
    // interaction, regardless of prior indeterminate value.
    this.indeterminate = false;
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
              id="checkbox"
              class="box"
              type="checkbox"
              .checked=${this.checked}
              ?disabled=${this.disabled}
              ?required=${this.required}
              name=${ifDefined(this.name || undefined)}
              value=${ifDefined(this.value || undefined)}
              aria-invalid=${hasError ? 'true' : 'false'}
              aria-describedby=${ifDefined(describedBy)}
              @change=${this._handleChange}
            />
            <svg class="mark" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path class="check-mark" d="M3.5 8.5L6.5 11.5L12.5 4.5" />
              <path class="dash-mark" d="M4 8H12" />
            </svg>
          </span>
          <label for="checkbox">
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

customElements.define('cdz-checkbox', CdzCheckbox);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-checkbox': CdzCheckbox;
  }
}
