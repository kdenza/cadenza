import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { fileInputStyles } from './file-input.styles.js';
import { warnIfLabelMissing } from '../shared/required-label.js';

/**
 * `<cdz-file-input>` — a labeled file picker.
 *
 * ARIA pattern: a real native `<input type="file">` is kept as the actual
 * focusable, keyboard-operable control, associated with its `<label>` via
 * `for`/`id` exactly like every other form atom here. What's different is
 * that the input is *visually hidden* (clipped, never `display: none` —
 * verified in-browser that a `display: none` file input refuses focus
 * entirely while a clipped one accepts it) and every visible part of the
 * control is drawn by this component instead.
 *
 * Why draw the chrome ourselves, rather than just styling
 * `::file-selector-button`? That pseudo-element *is* supported (verified
 * — unlike `<input type="range">`'s still-unshipped standard
 * pseudo-elements, see ADR-0013), so the button alone could have been
 * restyled in place. The blocker is the *other* half of the native
 * rendering: the "no file chosen" text sits in a **closed** UA shadow
 * root (confirmed: `input.shadowRoot` is `null`), so it can be neither
 * styled nor read nor replaced — and the browser localizes it from its
 * own language setting, not the page's. On a Spanish-language site opened
 * in an English browser, native rendering would put "No file chosen" in
 * the middle of Spanish UI, with no way to fix it. Drawing the visible
 * text ourselves is the only way to keep the control's language under the
 * application's control.
 *
 * The visible box forwards clicks to the hidden input; the keyboard path
 * never needs that forwarding, because the real input is what receives
 * focus and natively opens the picker on Enter/Space. The focus ring is
 * drawn on the box via `:has(input:focus-visible)`, since a ring on the
 * clipped input itself would be invisible.
 *
 * The visible trigger and filename text are `aria-hidden`: they duplicate
 * what the native input already exposes (its accessible name from the
 * label, and its selected-file state), so exposing them again would make
 * a screen reader announce the same information twice.
 *
 * **No settable `value`** — a real divergence from every other form atom
 * here, and a browser security boundary rather than a design choice.
 * Assigning a non-empty filename to a file input's `value` throws
 * `InvalidStateError` (verified: "may only be programmatically set to the
 * empty string"), because a page that could pre-fill this control could
 * silently upload arbitrary files off a visitor's disk. So `files` is
 * exposed read-only, and `clear()` wraps the one mutation the platform
 * does permit (setting `value` to `''`).
 *
 * Disabled uses native `disabled`, same reasoning as every other form
 * atom. `required` *is* meaningful here (unlike `<cdz-range>`, where
 * there's no empty state) — a required file input with nothing chosen is
 * genuinely invalid.
 *
 * Same required-`label` enforcement as every other form atom — see
 * `../shared/required-label.ts`.
 *
 * ## All three visible strings are the consumer's
 *
 * `triggerText`, `placeholder` and `multipleText`. The third was
 * hardcoded at first, which is the worst place for it to have been: this
 * component draws its own chrome *specifically* to take the copy back
 * from the browser's closed shadow root, which localises to the browser's
 * language rather than the page's (ADR-0014). Leaving one string
 * untranslatable made that one string worse than the native text it
 * replaced — the browser would at least have localised it.
 *
 * `multipleText` substitutes `{n}`. Known limit: a single template
 * handles languages with one plural form for n > 1, which covers Spanish
 * and English but not languages with separate few/many forms. Only n >= 2
 * ever reaches it — a single file shows its own name — so the gap is
 * narrower than it looks, but it is real and a consumer needing true
 * plural rules would have to render the count themselves.
 */
export class CdzFileInput extends LitElement {
  static styles = fileInputStyles;

  static properties = {
    label: { type: String },
    accept: { type: String },
    multiple: { type: Boolean },
    placeholder: { type: String },
    // The third user-facing string. It was hardcoded, which made it the
    // one piece of this component's copy no consumer could translate --
    // in a component that exists precisely to take that copy back from
    // the browser's own localisation. `{n}` is substituted with the count.
    multipleText: { type: String, attribute: 'multiple-text' },
    triggerText: { type: String, attribute: 'trigger-text' },
    helperText: { type: String, attribute: 'helper-text' },
    errorMessage: { type: String, attribute: 'error-message' },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    name: { type: String },
    // Internal render state, not public API. Explicit `attribute: false`
    // alongside `state: true` — see select.ts for why the manifest
    // analyzer needs both.
    _selectedNames: { state: true, attribute: false }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare label: string;
  declare accept: string;
  declare multiple: boolean;
  declare placeholder: string;
  declare multipleText: string;
  declare triggerText: string;
  declare helperText: string;
  declare errorMessage: string;
  declare required: boolean;
  declare disabled: boolean;
  declare name: string;
  private declare _selectedNames: string[];

  constructor() {
    super();
    this.label = '';
    this.accept = '';
    this.multiple = false;
    this.placeholder = 'Sin archivos seleccionados';
    this.multipleText = '{n} archivos seleccionados';
    this.triggerText = 'Elegir archivo';
    this.helperText = '';
    this.errorMessage = '';
    this.required = false;
    this.disabled = false;
    this.name = '';
    this._selectedNames = [];
  }

  /**
   * The currently selected files. Read-only by design — see the class
   * comment: the platform forbids setting a file input's value, so a
   * writable version of this couldn't be honored anyway.
   */
  get files(): File[] {
    const input = this.shadowRoot?.querySelector('input');
    return input?.files ? Array.from(input.files) : [];
  }

  /**
   * Clears the selection. This is the only programmatic mutation the
   * platform allows on a file input's value.
   */
  clear(): void {
    const input = this.shadowRoot?.querySelector('input');
    if (!input) return;
    input.value = '';
    this._selectedNames = [];
  }

  // See ../shared/required-label.ts for what this checks and why.
  protected willUpdate(): void {
    warnIfLabelMissing('cdz-file-input', this.label);
  }

  private _handleChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this._selectedNames = target.files ? Array.from(target.files).map((file) => file.name) : [];
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  private _handleControlClick(): void {
    // Only the pointer path needs this: keyboard users focus the real
    // input, which opens the picker natively on Enter/Space.
    if (this.disabled) return;
    this.shadowRoot?.querySelector('input')?.click();
  }

  private _displayText(): string {
    if (this._selectedNames.length === 0) return this.placeholder;
    if (this._selectedNames.length === 1) return this._selectedNames[0];
    // replaceAll, not replace: a string pattern substitutes only the first
    // occurrence, so "{n} de {n} archivos" came back with one placeholder
    // still in it.
    return this.multipleText.replaceAll('{n}', String(this._selectedNames.length));
  }

  render() {
    const hasError = this.errorMessage.length > 0;
    const hasHelper = this.helperText.length > 0;
    const describedBy = hasError ? 'error-text' : hasHelper ? 'helper-text' : undefined;
    const isPlaceholder = this._selectedNames.length === 0;

    return html`
      <div class="field">
        <label for="file">
          ${this.label}${this.required ? html`<span aria-hidden="true"> *</span>` : nothing}
        </label>
        <div class="control" @click=${this._handleControlClick}>
          <input
            id="file"
            type="file"
            accept=${ifDefined(this.accept || undefined)}
            ?multiple=${this.multiple}
            ?required=${this.required}
            ?disabled=${this.disabled}
            name=${ifDefined(this.name || undefined)}
            aria-invalid=${hasError ? 'true' : 'false'}
            aria-describedby=${ifDefined(describedBy)}
            @change=${this._handleChange}
          />
          <span class="trigger" aria-hidden="true">${this.triggerText}</span>
          <span class="filename ${isPlaceholder ? 'is-placeholder' : ''}" aria-hidden="true">
            ${this._displayText()}
          </span>
        </div>
        ${hasError
          ? html`<p id="error-text" class="caption error">${this.errorMessage}</p>`
          : hasHelper
            ? html`<p id="helper-text" class="caption helper">${this.helperText}</p>`
            : nothing}
      </div>
    `;
  }
}

customElements.define('cdz-file-input', CdzFileInput);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-file-input': CdzFileInput;
  }
}
