import { html, fixture, expect } from '@open-wc/testing';
import './badge.js';
import type { CdzBadge } from './badge.js';

const VARIANTS = ['neutral', 'info', 'success', 'warning', 'error'] as const;

describe('cdz-badge', () => {
  it('renders its slotted text', async () => {
    const el = await fixture<CdzBadge>(html`<cdz-badge>Pendiente</cdz-badge>`);
    expect(el.textContent!.trim()).to.equal('Pendiente');
    expect(el.shadowRoot!.querySelector('.badge')).to.exist;
  });

  it('defaults to the neutral variant, which carries no icon', async () => {
    const el = await fixture<CdzBadge>(html`<cdz-badge>Borrador</cdz-badge>`);
    expect(el.variant).to.equal('neutral');
    // "No status" has nothing to signal — an icon would imply severity.
    expect(el.shadowRoot!.querySelector('cdz-icon')).to.be.null;
  });

  it('gives every semantic variant a non-colour cue by default (WCAG 1.4.1)', async () => {
    const expected = {
      info: 'info',
      success: 'check',
      warning: 'alert-triangle',
      error: 'alert-circle'
    };
    for (const [variant, iconName] of Object.entries(expected)) {
      const el = await fixture<CdzBadge>(
        html`<cdz-badge variant=${variant}>Estado</cdz-badge>`
      );
      const icon = el.shadowRoot!.querySelector('cdz-icon');
      expect(icon, variant).to.exist;
      expect(icon!.getAttribute('name'), variant).to.equal(iconName);
    }
  });

  it('lets the icon be opted out of, but not by default', async () => {
    const withIcon = await fixture<CdzBadge>(html`<cdz-badge variant="error">Error</cdz-badge>`);
    expect(withIcon.shadowRoot!.querySelector('cdz-icon')).to.exist;

    const without = await fixture<CdzBadge>(
      html`<cdz-badge variant="error" hide-icon>Error</cdz-badge>`
    );
    expect(without.shadowRoot!.querySelector('cdz-icon')).to.be.null;
  });

  it('keeps the icon out of the accessibility tree — the text already says it', async () => {
    const el = await fixture<CdzBadge>(html`<cdz-badge variant="success">Completado</cdz-badge>`);
    const inner = el.shadowRoot!.querySelector('cdz-icon')!.shadowRoot!.querySelector('svg')!;
    expect(inner.getAttribute('aria-hidden')).to.equal('true');
    expect(inner.hasAttribute('role')).to.be.false;
  });

  it('is not a live region — a badge is content, not an announcement', async () => {
    const el = await fixture<CdzBadge>(html`<cdz-badge variant="error">Fallido</cdz-badge>`);
    const badge = el.shadowRoot!.querySelector('.badge')!;
    expect(badge.hasAttribute('role')).to.be.false;
    expect(badge.hasAttribute('aria-live')).to.be.false;
  });

  it('is accessible in every variant', async () => {
    for (const variant of VARIANTS) {
      const el = await fixture<CdzBadge>(
        html`<cdz-badge variant=${variant}>Estado</cdz-badge>`
      );
      await expect(el).to.be.accessible();
    }
  });

  it('reflects variant so the token-driven styling can key off it', async () => {
    const el = await fixture<CdzBadge>(html`<cdz-badge variant="warning">Atención</cdz-badge>`);
    expect(el.getAttribute('variant')).to.equal('warning');
  });

  it('paints every variant with its own foreground, and never leaves it unset', async () => {
    const seen = new Set<string>();
    for (const variant of VARIANTS) {
      const el = await fixture<CdzBadge>(
        html`<cdz-badge variant=${variant}>Estado</cdz-badge>`
      );
      const styles = getComputedStyle(el.shadowRoot!.querySelector('.badge')!);
      // Border shares the foreground colour on purpose (see badge.styles.ts).
      expect(styles.borderTopColor, variant).to.equal(styles.color);
      expect(styles.backgroundColor, variant).to.not.equal('rgba(0, 0, 0, 0)');
      seen.add(styles.color);
    }
    // Five variants must be five distinct colours, not a token that
    // silently failed to resolve and fell back to the same value.
    expect(seen.size).to.equal(VARIANTS.length);
  });

  it('falls back to neutral styling for an unrecognised variant', async () => {
    const bogus = await fixture<CdzBadge>(
      html`<cdz-badge variant="explosivo">Raro</cdz-badge>`
    );
    const neutral = await fixture<CdzBadge>(html`<cdz-badge>Raro</cdz-badge>`);
    expect(getComputedStyle(bogus.shadowRoot!.querySelector('.badge')!).color).to.equal(
      getComputedStyle(neutral.shadowRoot!.querySelector('.badge')!).color
    );
    expect(bogus.shadowRoot!.querySelector('cdz-icon')).to.be.null;
  });
});
