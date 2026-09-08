import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { radioGroupStyles } from './radio-group.styles.js';
import { warnIfLabelMissing } from '../shared/required-label.js';

export interface CdzRadioGroupOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type CdzRadioGroupOrientation = 'vertical' | 'horizontal';

/**
 * `<cdz-radio-group>` — single selection across a set of options.
 *
 * The second molecule, and the one ADR-0007 predicted would be needed:
 * native radio grouping does not cross shadow root boundaries, so two
 * `<cdz-radio>` atoms sharing a `name` are two groups of one, not a group
 * of two.
 *
 * The expected fix would be to slot `<cdz-radio>` children and coordinate
 * them by hand. This component does NOT do that, and the reason is the
 * whole point of ADR-0029: coordinating them by hand means reimplementing
 * mutual exclusion, roving tabindex, arrow-key navigation and set position
 * — the exact things ADR-0007 chose a native `<input type="radio">` to
 * avoid reimplementing. Composing the atoms would break the semantics the
 * atom was picked for.
 *
 * So the group renders its own native radios inside its single shadow
 * root, where they share one tree and the browser groups them for real.
 * Mutual exclusion, arrow keys, one tab stop for the whole group, and
 * "option 2 of 4" in the accessibility tree all come from the platform.
 *
 * `<fieldset>` + `<legend>` rather than `role="radiogroup"`: these are
 * native radios, and fieldset/legend is the grouping browsers and screen
 * readers already implement for them. `radiogroup` is the ARIA equivalent
 * for hand-built `role="radio"` widgets, which this is not.
 *
 * `<cdz-radio>` remains correct on its own, for a single standalone
 * choice. It is not a building block of this component.
 *
 * `required` lives here and not on the atom, exactly as ADR-0007 said it
 * should: "pick one of these" is a property of the group.
 */
export class CdzRadioGroup extends LitElement {
  static styles = radioGroupStyles;

  static properties = {
    label: { type: String },
    name: { type: String },
    options: { type: Array },
    value: { type: String, reflect: true },
    orientation: { type: String, reflect: true },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    helperText: { type: String, attribute: 'helper-text' },
    errorMessage: { type: String, attribute: 'error-message' }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare label: string;
  declare name: string;
  declare options: CdzRadioGroupOption[];
  declare value: string;
  declare orientation: CdzRadioGroupOrientation;
  declare required: boolean;
  declare disabled: boolean;
  declare helperText: string;
  declare errorMessage: string;

  /**
   * Radios with no `name` do not group at all — the browser needs a name
   * to know which inputs are mutually exclusive. So a name is always
   * present, generated when the consumer does not supply one.
   *
   * It does not need to be unique across the page: each group lives in its
   * own shadow root, and grouping is scoped to a tree. That is the same
   * boundary that breaks `<cdz-radio>` here, working in our favour.
   */
  private readonly _fallbackName = `cdz-radio-group-${Math.random().toString(36).slice(2, 9)}`;

  constructor() {
    super();
    this.label = '';
    this.name = '';
    this.options = [];
    this.value = '';
    this.orientation = 'vertical';
    this.required = false;
    this.disabled = false;
    this.helperText = '';
    this.errorMessage = '';
  }

  // See ../shared/required-label.ts for what this checks and why. Here the
  // label is the legend, which is what names the group for a screen reader.
  protected willUpdate(): void {
    warnIfLabelMissing('cdz-radio-group', this.label);
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
    const groupName = this.name || this._fallbackName;

    return html`
      <fieldset>
        <legend>${this.label}</legend>
        <div class="options">
          ${this.options.map((option, index) => {
            const id = `option-${index}`;
            return html`
              <span class="row">
                <span class="control-wrapper">
                  <input
                    id=${id}
                    class="circle"
                    type="radio"
                    name=${groupName}
                    value=${option.value}
                    .checked=${this.value === option.value}
                    ?disabled=${this.disabled || option.disabled === true}
                    ?required=${this.required}
                    aria-invalid=${hasError ? 'true' : 'false'}
                    aria-describedby=${ifDefined(describedBy)}
                    @change=${this._handleChange}
                  />
                  <span class="dot" aria-hidden="true"></span>
                </span>
                <label for=${id}>${option.label}</label>
              </span>
            `;
          })}
        </div>
        ${hasError
          ? html`<p id="error-text" class="caption error">${this.errorMessage}</p>`
          : hasHelper
            ? html`<p id="helper-text" class="caption helper">${this.helperText}</p>`
            : nothing}
      </fieldset>
    `;
  }
}

customElements.define('cdz-radio-group', CdzRadioGroup);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-radio-group': CdzRadioGroup;
  }
}
