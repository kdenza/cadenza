import { LitElement, html, svg, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { selectStyles } from './select.styles.js';
import { warnIfLabelMissing } from '../shared/required-label.js';
import { icons, ICON_GRID } from '../shared/icons.js';
import '../popover/popover.js';
import type { CdzPopover } from '../popover/popover.js';

export interface CdzSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * `<cdz-select>` — a labeled dropdown, built on `<cdz-popover>` instead of
 * a native `<select>`.
 *
 * ARIA pattern: the WAI-ARIA APG "Select-Only Combobox" — a `<button
 * role="combobox">` trigger (`aria-haspopup="listbox"`, `aria-expanded`,
 * `aria-controls`) plus a `role="listbox"`/`role="option"` panel. Real DOM
 * focus never leaves the trigger button; the "active" (highlighted)
 * option while the panel is open is tracked with `aria-activedescendant`
 * instead — verified in-browser (see `cdz-popover`'s class comment) that
 * opening an `auto` popover with nothing `autofocus` inside does not
 * steal focus, which is exactly what this pattern needs.
 *
 * This replaces the native-`<select>`-based version from ADR-0009: that
 * approach got keyboard/AT semantics for free but could never restyle the
 * open dropdown popup in any browser — a real, hard platform ceiling.
 * This version reimplements the keyboard behavior by hand (arrows,
 * Home/End, single-character type-ahead, Enter/Space to commit, Escape to
 * close — the last one free from `cdz-popover`'s native light-dismiss) in
 * exchange for full control over how the open panel looks. See
 * ADR-0010 for the full trade-off writeup, including two deliberate
 * simplifications versus native `<select>`: type-ahead only matches a
 * single character at a time (no multi-character buffered search), and
 * arrow-key navigation only *highlights* an option — the value only
 * changes on explicit commit (Enter/Space/click), not on every arrow
 * press the way a native open `<select>` previews live.
 *
 * `disabled` uses the native attribute on the trigger `<button>`, not
 * `aria-disabled` — same reasoning as every other form atom here (a
 * disabled field should be unreachable by keyboard), not the
 * discoverable-but-blocked treatment `cdz-button` uses for actions.
 *
 * Same required-`label` enforcement as every other form atom — see
 * `../shared/required-label.ts`. Note: dropping the native `<select>`
 * also drops its Constraint Validation API participation — already a
 * known, deferred gap for every form atom here pending a real
 * `ElementInternals` decision (ADR-0003's action item 5), not a new
 * regression.
 */
export class CdzSelect extends LitElement {
  static styles = selectStyles;

  static properties = {
    label: { type: String },
    options: { type: Array },
    value: { type: String },
    placeholder: { type: String },
    helperText: { type: String, attribute: 'helper-text' },
    errorMessage: { type: String, attribute: 'error-message' },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
    name: { type: String },
    // `state: true` implies `attribute: false` at runtime, but the
    // custom-elements-manifest analyzer's plugin for the (non-decorator)
    // `static properties` syntax only checks for a literal
    // `attribute: false` -- it doesn't special-case `state` -- so without
    // this explicit flag these two would wrongly show up as public
    // attributes/controls in the gallery. Verified by inspecting
    // node_modules/@custom-elements-manifest/analyzer's lit static-
    // properties plugin directly.
    _open: { state: true, attribute: false },
    _activeIndex: { state: true, attribute: false }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare label: string;
  declare options: CdzSelectOption[];
  declare value: string;
  declare placeholder: string;
  declare helperText: string;
  declare errorMessage: string;
  declare required: boolean;
  declare disabled: boolean;
  declare name: string;
  private declare _open: boolean;
  private declare _activeIndex: number;

  private _popoverEl: CdzPopover | null = null;
  private _triggerEl: HTMLButtonElement | null = null;

  // Listens for cdz-popover's native `toggle` event (light-dismiss,
  // Escape, another exclusive popover taking over -- changes we didn't
  // initiate). For changes *we* do initiate (click, keyboard), the
  // trigger/keydown handlers below call _syncOpenState() directly instead
  // of waiting for this: that event is dispatched as a separate queued
  // task (verified in cdz-popover's own tests), so relying on it alone
  // would leave `_open`/`_activeIndex` stale for a tick after every
  // self-initiated show()/hide()/toggle().
  private readonly _handlePopoverToggle = (): void => {
    this._syncOpenState();
  };

  private _syncOpenState(): void {
    // `:popover-open` rather than cdz-popover's `open` property: the
    // browser hides a popover when it leaves the document, without
    // telling the element, so that property can outlive the state it
    // describes. The pseudo-class is the browser's own answer, and is
    // already what cdz-popover's own show()/hide()/toggle() test.
    const isOpen = this._popoverEl?.matches(':popover-open') ?? false;
    this._open = isOpen;
    if (isOpen) {
      if (this._popoverEl && this._triggerEl) {
        this._popoverEl.style.width = `${this._triggerEl.offsetWidth}px`;
      }
      const currentIndex = this.options.findIndex((option) => option.value === this.value);
      this._activeIndex = currentIndex >= 0 ? currentIndex : this._firstEnabledIndex();
    } else {
      this._activeIndex = -1;
    }
  }

  constructor() {
    super();
    this.label = '';
    this.options = [];
    this.value = '';
    this.placeholder = '';
    this.helperText = '';
    this.errorMessage = '';
    this.required = false;
    this.disabled = false;
    this.name = '';
    this._open = false;
    this._activeIndex = -1;
  }

  // See ../shared/required-label.ts for what this checks and why.
  protected willUpdate(): void {
    warnIfLabelMissing('cdz-select', this.label);
  }

  protected firstUpdated(): void {
    this._popoverEl = this.shadowRoot!.querySelector('cdz-popover');
    this._triggerEl = this.shadowRoot!.querySelector('#trigger');
    if (this._popoverEl && this._triggerEl) {
      this._popoverEl.anchor = this._triggerEl;
      this._popoverEl.addEventListener('toggle', this._handlePopoverToggle);
    }
  }

  // Setup runs in firstUpdated(), which fires once per element, but
  // teardown runs on every unmount -- so re-parenting this element (moved
  // in the DOM, re-keyed by a framework, mounted into a dialog) left it
  // permanently deaf to the changes it does not initiate: light-dismiss,
  // Escape, another exclusive popover taking over. It would then report
  // aria-expanded="true" over a listbox the browser had already closed.
  // cdz-popover re-arms its own native listener exactly this way.
  connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasUpdated) return;
    this._popoverEl?.addEventListener('toggle', this._handlePopoverToggle);
    // Removing a showing popover from the document hides it, so whatever
    // _open held before the move is stale by definition.
    this._syncOpenState();
  }

  disconnectedCallback(): void {
    this._popoverEl?.removeEventListener('toggle', this._handlePopoverToggle);
    super.disconnectedCallback();
  }

  private _firstEnabledIndex(): number {
    return this.options.findIndex((option) => !option.disabled);
  }

  private _lastEnabledIndex(): number {
    for (let i = this.options.length - 1; i >= 0; i--) {
      if (!this.options[i].disabled) return i;
    }
    return -1;
  }

  private _nextEnabledIndex(from: number): number {
    for (let i = from + 1; i < this.options.length; i++) {
      if (!this.options[i].disabled) return i;
    }
    return from; // No further option -- stays put, same as native <select>.
  }

  private _prevEnabledIndex(from: number): number {
    for (let i = from - 1; i >= 0; i--) {
      if (!this.options[i].disabled) return i;
    }
    return from;
  }

  private _commit(index: number): void {
    const option = this.options[index];
    if (!option || option.disabled) return;
    // A native <select> fires `change` only when the value actually
    // changes -- re-picking the option already selected is silent there.
    // This fired every time, so a consumer counting changes (dirty state,
    // analytics, an autosave) saw edits the user never made.
    const changed = this.value !== option.value;
    this.value = option.value;
    if (changed) this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    this._popoverEl?.hide();
    this._syncOpenState();
  }

  private _typeahead(char: string): number {
    if (this.options.length === 0) return -1;
    const lower = char.toLowerCase();
    const start = this._open ? this._activeIndex : this.options.findIndex((option) => option.value === this.value);
    for (let offset = 1; offset <= this.options.length; offset++) {
      const index = (start + offset + this.options.length) % this.options.length;
      const option = this.options[index];
      if (!option.disabled && option.label.toLowerCase().startsWith(lower)) return index;
    }
    return -1;
  }

  // Light dismiss runs between pointerdown and click -- measured: a
  // pointerdown listener on the trigger still sees :popover-open, a click
  // listener on the same element no longer does. So with a real pointer
  // the browser had already closed the panel by the time click arrived,
  // and toggle() promptly reopened it: **the trigger could never close
  // the select.** Every test missed it because a synthetic .click()
  // dispatches no pointer events and so never triggers light dismiss at
  // all -- the same class of green-and-measuring-nothing test ADR-0029
  // found with synthetic key events.
  private _openAtPointerDown: boolean | null = null;

  private _handleTriggerPointerDown(): void {
    this._openAtPointerDown = this._popoverEl?.matches(':popover-open') ?? false;
  }

  private _handleTriggerClick(): void {
    // The snapshot when there was a pointer behind this click; the live
    // state otherwise (a programmatic .click(), or activation from
    // assistive technology), where light dismiss never ran and the
    // current state is still the truthful one.
    const wasOpen = this._openAtPointerDown ?? (this._popoverEl?.matches(':popover-open') ?? false);
    this._openAtPointerDown = null;
    if (wasOpen) this._popoverEl?.hide();
    else this._popoverEl?.show();
    this._syncOpenState();
  }

  private _handleTriggerKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this._open) {
          this._popoverEl?.show();
          this._syncOpenState();
        } else this._activeIndex = this._nextEnabledIndex(this._activeIndex);
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (!this._open) {
          this._popoverEl?.show();
          this._syncOpenState();
        } else this._activeIndex = this._prevEnabledIndex(this._activeIndex);
        return;
      case 'Home':
        if (!this._open) return;
        event.preventDefault();
        this._activeIndex = this._firstEnabledIndex();
        return;
      case 'End':
        if (!this._open) return;
        event.preventDefault();
        this._activeIndex = this._lastEnabledIndex();
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!this._open) {
          this._popoverEl?.show();
          this._syncOpenState();
        } else this._commit(this._activeIndex);
        return;
      default:
        if (event.key.length === 1 && /\S/.test(event.key)) {
          const index = this._typeahead(event.key);
          if (index < 0) return;
          if (this._open) this._activeIndex = index;
          else this._commit(index);
        }
    }
  }

  render() {
    const hasError = this.errorMessage.length > 0;
    const hasHelper = this.helperText.length > 0;
    const describedBy = hasError ? 'error-text' : hasHelper ? 'helper-text' : undefined;
    const selectedOption = this.options.find((option) => option.value === this.value);
    const showPlaceholder = !selectedOption && this.placeholder.length > 0;
    const displayText = selectedOption ? selectedOption.label : this.placeholder;

    return html`
      <div class="field">
        <label id="select-label" for="trigger">
          ${this.label}${this.required ? html`<span aria-hidden="true"> *</span>` : nothing}
        </label>
        <span class="select-wrapper">
          <button
            type="button"
            id="trigger"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded=${this._open ? 'true' : 'false'}
            aria-controls="listbox"
            aria-activedescendant=${this._open && this._activeIndex >= 0
              ? `option-${this._activeIndex}`
              : nothing}
            aria-invalid=${hasError ? 'true' : 'false'}
            aria-describedby=${ifDefined(describedBy)}
            data-placeholder=${showPlaceholder ? '' : nothing}
            ?disabled=${this.disabled}
            @pointerdown=${this._handleTriggerPointerDown}
            @click=${this._handleTriggerClick}
            @keydown=${this._handleTriggerKeydown}
          >
            <span class="value">${displayText}</span>
            <svg
              class="chevron"
              viewBox="0 0 ${ICON_GRID} ${ICON_GRID}"
              aria-hidden="true"
              focusable="false"
            >
              ${icons['chevron-down'].paths.map((d) => svg`<path d=${d} />`)}
            </svg>
          </button>
          <cdz-popover>
            <ul role="listbox" id="listbox" aria-labelledby="select-label">
              ${this.options.map(
                (option, index) => html`
                  <li
                    id="option-${index}"
                    role="option"
                    aria-selected=${option.value === this.value ? 'true' : 'false'}
                    aria-disabled=${option.disabled ? 'true' : 'false'}
                    class=${index === this._activeIndex ? 'active' : ''}
                    @click=${() => this._commit(index)}
                    @pointerenter=${() => {
                      if (!option.disabled) this._activeIndex = index;
                    }}
                  >
                    ${option.label}
                  </li>
                `
              )}
            </ul>
          </cdz-popover>
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

customElements.define('cdz-select', CdzSelect);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-select': CdzSelect;
  }
}
