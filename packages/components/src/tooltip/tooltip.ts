import { LitElement, html } from 'lit';
import { tooltipStyles } from './tooltip.styles.js';
import '../popover/popover.js';
import type { CdzPopover } from '../popover/popover.js';

let tooltipIdCounter = 0;

/**
 * `<cdz-tooltip>` — a short description attached to a trigger.
 *
 * ```html
 * <cdz-tooltip text="Se envía a tu correo">
 *   <cdz-button>Enviar</cdz-button>
 * </cdz-tooltip>
 * ```
 *
 * ## Where the accessible text lives, and why it isn't in the shadow root
 *
 * The obvious arrangement — render the bubble in the shadow root and
 * point the trigger at it with `aria-describedby` — cannot work, and
 * fails *silently*, which is why it's worth spelling out. Verified
 * in-browser:
 *
 * - `aria-describedby` resolves IDs within a single tree scope. The
 *   trigger is a light-DOM child (the consumer wrote it); the bubble
 *   would be in this component's shadow root. The ID does not resolve
 *   across that boundary.
 * - The modern replacement, `ariaDescribedByElements`, exists and is
 *   supported — but assigning an element that lives *inside* a shadow
 *   root, from a trigger outside it, **drops the reference with no
 *   error**: the array reads back with length 0. Referencing outward
 *   (shadow → light) does work; only the inward direction is blocked.
 *
 * So the description is a separate, visually hidden node appended to
 * this element's own **light DOM**, in the same tree scope as the
 * trigger, where the ID resolves the way it always has. It carries
 * `role="tooltip"` because it is the element actually referenced.
 *
 * That node is slotted, and hidden by clipping rather than
 * `display: none` — an unrendered node is not in the accessibility tree,
 * which would defeat the entire arrangement.
 *
 * The visible bubble is therefore pure decoration and is `aria-hidden`.
 * The text is duplicated between the two, which is the price shadow DOM
 * charges here; `aria-description` (a plain string, no ID reference)
 * would remove the duplication entirely and is supported in this
 * browser, but its assistive-technology support is younger than
 * `aria-describedby`'s. Recorded in ADR-0020 as the simplification to
 * revisit.
 *
 * ## Why the popover is `manual`
 *
 * `<cdz-popover>` defaults to `popover="auto"`, and auto popovers close
 * one another — verified. A tooltip appearing while a `<cdz-select>`
 * listbox is open would therefore close the listbox, which is a real
 * interaction bug and not a hypothetical one. `manual` popovers coexist
 * with `auto` ones in both directions, so this uses `manual` and pays
 * for it by handling Escape itself.
 *
 * ## WCAG 1.4.13 (Content on Hover or Focus)
 *
 * All three conditions are met deliberately:
 *
 * - **Dismissible** — Escape closes the tooltip without moving the
 *   pointer or the focus.
 * - **Hoverable** — the pointer can travel from the trigger onto the
 *   tooltip without it vanishing. Leaving the trigger schedules a close
 *   rather than closing immediately, and entering the bubble cancels it.
 *   This matters most for someone using screen magnification, for whom
 *   reading the tooltip may require moving the pointer onto it.
 * - **Persistent** — it stays until dismissed or until hover *and* focus
 *   both leave. Nothing closes it on a timer.
 *
 * Focus opens it with no delay; hover waits, so that sweeping the
 * pointer across a row of controls doesn't flash a tooltip per control.
 *
 * ## What this is not
 *
 * A tooltip must not contain interactive content: it is reachable by
 * neither Tab nor a screen reader's cursor as a container, so anything
 * focusable inside it would be unreachable. `text` is a plain string
 * rather than a slot precisely so that this is impossible to get wrong.
 * A floating panel that needs buttons or links is a popover, and
 * `<cdz-popover>` is already the primitive for that.
 */
export class CdzTooltip extends LitElement {
  static styles = tooltipStyles;

  static properties = {
    text: { type: String },
    _open: { state: true, attribute: false }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare text: string;
  private declare _open: boolean;

  private readonly _descriptionId = `cdz-tooltip-${++tooltipIdCounter}`;
  private _descriptionNode: HTMLElement | null = null;
  private _bubble: CdzPopover | null = null;
  private _trigger: HTMLElement | null = null;
  private _openTimer = 0;
  private _closeTimer = 0;

  constructor() {
    super();
    this.text = '';
    this._open = false;
  }

  connectedCallback(): void {
    super.connectedCallback();
    // Escape must work regardless of where focus currently sits, so this
    // listens on the document rather than on the trigger.
    document.addEventListener('keydown', this._handleKeydown);
  }

  disconnectedCallback(): void {
    document.removeEventListener('keydown', this._handleKeydown);
    this._clearTimers();
    super.disconnectedCallback();
  }

  protected firstUpdated(): void {
    this._ensureLightDomNodes();
    this._wireTrigger();
  }

  protected updated(changed: Map<string, unknown>): void {
    if (changed.has('text')) {
      if (this._descriptionNode) this._descriptionNode.textContent = this.text;
      if (this._bubble) this._bubble.textContent = this.text;
    }
  }

  /**
   * Builds both auxiliary nodes as children of `this` — that is, in the
   * **light DOM**, sharing a tree scope with the slotted trigger. Neither
   * could live in the shadow root, and for the same underlying reason:
   *
   * - The description is referenced by `aria-describedby`, whose IDs
   *   resolve within one tree scope.
   * - The bubble is positioned by CSS Anchor Positioning, whose
   *   `anchor-name` is *also* tree-scoped. Verified: an identical pair
   *   anchors correctly when both sit in the same shadow root (what
   *   `<cdz-select>` does), and silently lands at 0,0 when the trigger is
   *   in the light DOM and the bubble is not.
   *
   * That second one is the whole reason this component builds its DOM
   * imperatively instead of rendering it in the template.
   */
  private _ensureLightDomNodes(): void {
    if (this._descriptionNode) return;

    const description = document.createElement('span');
    description.id = this._descriptionId;
    description.setAttribute('role', 'tooltip');
    description.setAttribute('data-cdz-tooltip-text', '');
    description.textContent = this.text;
    this.appendChild(description);
    this._descriptionNode = description;

    const bubble = document.createElement('cdz-popover') as CdzPopover;
    bubble.setAttribute('type', 'manual');
    bubble.setAttribute('data-cdz-tooltip-bubble', '');
    // Decoration only: the description node above is what assistive
    // technology reads, so announcing this too would just repeat it.
    bubble.setAttribute('aria-hidden', 'true');
    bubble.textContent = this.text;
    bubble.addEventListener('mouseenter', this._handleTooltipEnter);
    bubble.addEventListener('mouseleave', this._handleTooltipLeave);
    this.appendChild(bubble);
    this._bubble = bubble;
  }

  /** The trigger is the first slotted element that isn't one of ours. */
  private _wireTrigger(): void {
    const slot = this.shadowRoot?.querySelector('slot');
    const assigned = (slot?.assignedElements() ?? []).filter(
      (el) =>
        !el.hasAttribute('data-cdz-tooltip-text') &&
        !el.hasAttribute('data-cdz-tooltip-bubble')
    );
    const trigger = assigned[0] as HTMLElement | undefined;
    if (!trigger) {
      console.error(
        '[cdz-tooltip] No hay ningún elemento al que describir. Pon el ' +
          'disparador dentro del componente, por ejemplo ' +
          '<cdz-tooltip text="..."><cdz-button>Ayuda</cdz-button></cdz-tooltip>.'
      );
      return;
    }

    this._trigger = trigger;
    trigger.setAttribute('aria-describedby', this._descriptionId);
    trigger.addEventListener('mouseenter', this._handleTriggerEnter);
    trigger.addEventListener('mouseleave', this._handleTriggerLeave);
    trigger.addEventListener('focusin', this._handleFocusIn);
    trigger.addEventListener('focusout', this._handleFocusOut);

    if (this._bubble) this._bubble.anchor = trigger;
  }

  private _clearTimers(): void {
    clearTimeout(this._openTimer);
    clearTimeout(this._closeTimer);
    this._openTimer = 0;
    this._closeTimer = 0;
  }

  private _readDelay(name: 'open' | 'close', fallback: number): number {
    const raw = getComputedStyle(this).getPropertyValue(`--cdz-tooltip-delay-${name}`).trim();
    const parsed = Number.parseFloat(raw);
    if (Number.isNaN(parsed)) return fallback;
    return raw.endsWith('ms') ? parsed : parsed * 1000;
  }

  private _show(): void {
    this._clearTimers();
    this._bubble?.show();
    this._open = true;
  }

  private _hide(): void {
    this._clearTimers();
    this._bubble?.hide();
    this._open = false;
  }

  private readonly _handleTriggerEnter = (): void => {
    clearTimeout(this._closeTimer);
    // Hover waits, so sweeping across several controls doesn't flash one
    // tooltip per control. Focus (below) opens with no delay.
    this._openTimer = window.setTimeout(() => this._show(), this._readDelay('open', 400));
  };

  private readonly _handleTriggerLeave = (): void => {
    clearTimeout(this._openTimer);
    // Scheduled rather than immediate: this is what makes the tooltip
    // "hoverable" per WCAG 1.4.13 — the pointer needs time to travel
    // from the trigger onto the bubble.
    this._closeTimer = window.setTimeout(() => this._hide(), this._readDelay('close', 150));
  };

  private readonly _handleTooltipEnter = (): void => {
    clearTimeout(this._closeTimer);
  };

  private readonly _handleTooltipLeave = (): void => {
    this._closeTimer = window.setTimeout(() => this._hide(), this._readDelay('close', 150));
  };

  private readonly _handleFocusIn = (): void => {
    this._show();
  };

  private readonly _handleFocusOut = (): void => {
    // The bubble holds nothing focusable by design, so focus leaving the
    // trigger always means the tooltip should go.
    this._hide();
  };

  private readonly _handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this._open) {
      // Dismissible per WCAG 1.4.13, without moving pointer or focus.
      this._hide();
    }
  };

  // Nothing but the slot: both auxiliary nodes are built in the light DOM
  // by _ensureLightDomNodes(), because neither ARIA references nor anchor
  // positioning cross the shadow boundary.
  render() {
    return html`<slot></slot>`;
  }
}

customElements.define('cdz-tooltip', CdzTooltip);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-tooltip': CdzTooltip;
  }
}
