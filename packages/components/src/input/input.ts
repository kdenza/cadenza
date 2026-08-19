import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { inputStyles } from './input.styles.js';
import { warnIfLabelMissing } from '../shared/required-label.js';

export type CdzInputType = 'text' | 'email' | 'password' | 'tel' | 'search' | 'url' | 'number';

/**
 * `<cdz-input>` — a labeled single-line text field.
 *
 * ARIA pattern: label and input share a `for`/`id` pair scoped to this
 * element's own shadow root (safe to reuse the same literal ids across
 * every instance — each shadow root is its own ID namespace). Helper text
 * and the error message are exposed via `aria-describedby`, not just shown
 * visually, so a screen reader announces them the moment the field
 * receives focus rather than only on visual inspection. When an error is
 * present it replaces the helper text (both visually and in
 * `aria-describedby`) and sets `aria-invalid="true"`.
 *
 * Disabled state uses the *native* `disabled` attribute here, deliberately
 * unlike `<cdz-button>`'s `aria-disabled` pattern: a disabled field has no
 * "explain why this is unavailable" affordance to preserve, and native
 * `disabled` is what correctly excludes the field's value from
 * `FormData`/form submission — the behavior you actually want for a
 * disabled form control.
 */
export class CdzInput extends LitElement {
  static styles = inputStyles;

  static properties = {
    label: { type: String },
    value: { type: String },
    type: { type: String },
    placeholder: { type: String },
    helperText: { type: String, attribute: 'helper-text' },
    errorMessage: { type: String, attribute: 'error-message' },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    name: { type: String },
    autocomplete: { type: String }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare label: string;
  declare value: string;
  declare type: CdzInputType;
  declare placeholder: string;
  declare helperText: string;
  declare errorMessage: string;
  declare required: boolean;
  declare disabled: boolean;
  declare name: string;
  declare autocomplete: string;

  constructor() {
    super();
    this.label = '';
    this.value = '';
    this.type = 'text';
    this.placeholder = '';
    this.helperText = '';
    this.errorMessage = '';
    this.required = false;
    this.disabled = false;
    this.name = '';
    this.autocomplete = '';
  }

  // See ../shared/required-label.ts for what this checks and why.
  protected willUpdate(): void {
    warnIfLabelMissing('cdz-input', this.label);
  }

  private _handleInput(event: InputEvent): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    // Re-dispatched from the host, explicitly composed, so consumers
    // outside the shadow root can listen the same way they would on a
    // native <input> without relying on the native event's own
    // composed/bubbles flags.
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }

  private _handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  render() {
    const hasError = this.errorMessage.length > 0;
    const hasHelper = this.helperText.length > 0;
    const describedBy = hasError ? 'error-text' : hasHelper ? 'helper-text' : undefined;

    return html`
      <div class="field">
        <label for="input">
          ${this.label}${this.required ? html`<span aria-hidden="true"> *</span>` : nothing}
        </label>
        <input
          id="input"
          type=${this.type}
          .value=${this.value}
          placeholder=${ifDefined(this.placeholder || undefined)}
          ?required=${this.required}
          ?disabled=${this.disabled}
          name=${ifDefined(this.name || undefined)}
          autocomplete=${ifDefined(this.autocomplete || undefined)}
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

customElements.define('cdz-input', CdzInput);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-input': CdzInput;
  }
}
