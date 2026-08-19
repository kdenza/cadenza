import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { textareaStyles } from './textarea.styles.js';
import { warnIfLabelMissing } from '../shared/required-label.js';

/**
 * `<cdz-textarea>` — a labeled multi-line text field.
 *
 * ARIA pattern: identical to `<cdz-input>` — label/field share a `for`/`id`
 * pair scoped to this element's own shadow root, helper text and the error
 * message are exposed via `aria-describedby` (not just shown visually), and
 * an error sets `aria-invalid="true"` and replaces the helper text rather
 * than showing alongside it. Disabled uses the native `disabled` attribute,
 * same reasoning as every other form atom here: it correctly excludes the
 * value from `FormData`, and a disabled field has no "explain why this is
 * unavailable" affordance worth preserving the way `cdz-button` does.
 *
 * The one real difference from `<cdz-input>`: `rows` (native, controls
 * initial visible height) instead of `type` (a `<textarea>` has no type
 * variants). Resize is deliberately `vertical`-only, not `both` (the
 * native default) or `none` — width should stay governed by the
 * surrounding layout like any other block-level field, but letting the
 * height grow is a real, common need a fixed `rows` can't always predict.
 *
 * Same required-`label` enforcement as every other form atom — see
 * `../shared/required-label.ts`.
 */
export class CdzTextarea extends LitElement {
  static styles = textareaStyles;

  static properties = {
    label: { type: String },
    value: { type: String },
    rows: { type: Number },
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
  declare rows: number;
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
    this.rows = 4;
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
    warnIfLabelMissing('cdz-textarea', this.label);
  }

  private _handleInput(event: InputEvent): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }

  private _handleChange(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  render() {
    const hasError = this.errorMessage.length > 0;
    const hasHelper = this.helperText.length > 0;
    const describedBy = hasError ? 'error-text' : hasHelper ? 'helper-text' : undefined;

    return html`
      <div class="field">
        <label for="textarea">
          ${this.label}${this.required ? html`<span aria-hidden="true"> *</span>` : nothing}
        </label>
        <textarea
          id="textarea"
          rows=${this.rows}
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
        ></textarea>
        ${hasError
          ? html`<p id="error-text" class="caption error">${this.errorMessage}</p>`
          : hasHelper
            ? html`<p id="helper-text" class="caption helper">${this.helperText}</p>`
            : nothing}
      </div>
    `;
  }
}

customElements.define('cdz-textarea', CdzTextarea);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-textarea': CdzTextarea;
  }
}
