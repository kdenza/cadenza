import { LitElement, html, nothing } from 'lit';
import { badgeStyles } from './badge.styles.js';
import '../icon/icon.js';
import type { CdzIconName } from '../shared/icons.js';

export type CdzBadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'error';

/**
 * Which icon each semantic variant carries. `neutral` has none on
 * purpose: it means "no status", so there is nothing for an icon to
 * signal and adding one would imply severity that isn't there.
 */
const VARIANT_ICON: Record<CdzBadgeVariant, CdzIconName | null> = {
  neutral: null,
  info: 'info',
  success: 'check',
  warning: 'alert-triangle',
  error: 'alert-circle'
};

/**
 * `<cdz-badge>` — a small status label.
 *
 * Not interactive, and not announced as anything special: it renders a
 * plain `<span>` around slotted text. That's deliberate. A badge is a
 * piece of *content*, so the text inside it is already exposed to
 * assistive technology by being text; wrapping it in `role="status"`
 * would turn every badge on a page into a live region that interrupts
 * whatever a screen-reader user is currently reading. Live-region
 * behaviour belongs to a future alert/toast component, where the content
 * actually arrives after page load.
 *
 * **The icon reinforces the variant; it is not what makes the badge
 * accessible.** Worth stating precisely, because it's easy to overclaim:
 * the badge's own *text* is the primary non-colour carrier of meaning —
 * "Completado" and "Fallido" are already distinguishable without seeing
 * either colour or icon. What the icon adds is a shape cue that survives
 * *scanning*: in a list of many badges, someone who can't separate the
 * hues still gets a per-row signal without reading each label. That's a
 * real gain, but it is reinforcement, not the WCAG 1.4.1 fix on its own.
 *
 * The genuine 1.4.1 risk is a badge whose text doesn't say the status at
 * all — `<cdz-badge variant="error">3</cdz-badge>`, where red is the only
 * thing meaning "errors". No API can detect that, and no icon repairs
 * it: the answer is that the status belongs in the text.
 *
 * `hideIcon` is opt-out rather than opt-in so the reinforced arrangement
 * is what a consumer gets without thinking about it.
 *
 * **Known limit of the icon cue at this size.** Badge icons render at
 * `sm` (16px), and ADR-0016 records that `info` and `alert-circle` are
 * not reliably tellable apart from each other at that size — their marks
 * differ by about 2 real pixels. So the shape cue distinguishes *info or
 * error* from *success or warning*, but does not separate info from error
 * on its own. Their text does, which is why this is a limitation rather
 * than a defect. Bumping badge icons to `md` would fix it and make them
 * larger than the 14px text they sit beside, which reads worse; the
 * trade was taken knowingly.
 *
 * The icons stay `aria-hidden` (cdz-icon's default): they duplicate what
 * the badge's text says, so announcing them would repeat it.
 *
 * See ADR-0017 for the status palette this introduced, and the contrast
 * table behind it.
 */
export class CdzBadge extends LitElement {
  static styles = badgeStyles;

  static properties = {
    variant: { type: String, reflect: true },
    hideIcon: { type: Boolean, attribute: 'hide-icon' }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare variant: CdzBadgeVariant;
  declare hideIcon: boolean;

  constructor() {
    super();
    this.variant = 'neutral';
    this.hideIcon = false;
  }

  render() {
    const iconName = VARIANT_ICON[this.variant] ?? null;
    const showIcon = iconName !== null && !this.hideIcon;

    return html`
      <span class="badge">
        ${showIcon ? html`<cdz-icon name=${iconName} size="sm"></cdz-icon>` : nothing}
        <slot></slot>
      </span>
    `;
  }
}

customElements.define('cdz-badge', CdzBadge);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-badge': CdzBadge;
  }
}
