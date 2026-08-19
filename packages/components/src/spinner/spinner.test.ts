import { html, fixture, expect } from '@open-wc/testing';
import './spinner.js';
import type { CdzSpinner } from './spinner.js';
import { ICON_GRID } from '../shared/icons.js';

/**
 * Walks a component's own stylesheets looking for a media rule. Reading
 * the CSSOM rather than trusting that the source was written correctly:
 * a typo in the media query would leave reduced-motion users spinning,
 * and nothing else in the suite would notice.
 */
function findMediaRule(el: HTMLElement, condition: string): CSSMediaRule | null {
  for (const sheet of (el.shadowRoot as ShadowRoot).adoptedStyleSheets) {
    for (const rule of Array.from(sheet.cssRules)) {
      if (rule instanceof CSSMediaRule && rule.conditionText.includes(condition)) {
        return rule;
      }
    }
  }
  return null;
}

describe('cdz-spinner', () => {
  it('announces itself politely — unlike cdz-badge, this is an event', async () => {
    const el = await fixture<CdzSpinner>(html`<cdz-spinner></cdz-spinner>`);
    const region = el.shadowRoot!.querySelector('[role="status"]');
    expect(region).to.exist;
    // role=status is implicitly polite; an explicit assertive would be wrong.
    expect(region!.getAttribute('aria-live')).to.not.equal('assertive');
  });

  it('carries a default accessible label, and lets it be translated', async () => {
    const el = await fixture<CdzSpinner>(html`<cdz-spinner></cdz-spinner>`);
    expect(el.shadowRoot!.querySelector('.label')!.textContent!.trim()).to.equal('Cargando…');

    const translated = await fixture<CdzSpinner>(
      html`<cdz-spinner label="Loading…"></cdz-spinner>`
    );
    expect(translated.shadowRoot!.querySelector('.label')!.textContent!.trim()).to.equal(
      'Loading…'
    );
  });

  it('keeps the label in the accessibility tree while hiding it visually', async () => {
    const el = await fixture<CdzSpinner>(html`<cdz-spinner></cdz-spinner>`);
    const styles = getComputedStyle(el.shadowRoot!.querySelector('.label')!);
    expect(styles.display).to.not.equal('none');
    expect(styles.visibility).to.not.equal('hidden');
  });

  it('hides the decorative ring from assistive tech', async () => {
    const el = await fixture<CdzSpinner>(html`<cdz-spinner></cdz-spinner>`);
    expect(el.shadowRoot!.querySelector('svg')!.getAttribute('aria-hidden')).to.equal('true');
  });

  it('is accessible', async () => {
    const el = await fixture<CdzSpinner>(html`<cdz-spinner></cdz-spinner>`);
    await expect(el).to.be.accessible();
  });

  it('shares the icon system grid so it can stand in for a status icon', async () => {
    const el = await fixture<CdzSpinner>(html`<cdz-spinner></cdz-spinner>`);
    const svg = el.shadowRoot!.querySelector('svg')!;
    expect(svg.getAttribute('viewBox')).to.equal(`0 0 ${ICON_GRID} ${ICON_GRID}`);
    // Same radius as info / alert-circle (ADR-0016).
    for (const circle of el.shadowRoot!.querySelectorAll('circle')) {
      expect(circle.getAttribute('r')).to.equal('9');
      expect(circle.getAttribute('cx')).to.equal(String(ICON_GRID / 2));
    }
  });

  it('normalises the arc with pathLength so the dash array reads as a percentage', async () => {
    const el = await fixture<CdzSpinner>(html`<cdz-spinner></cdz-spinner>`);
    const arc = el.shadowRoot!.querySelector('.arc')!;
    expect(arc.getAttribute('pathLength')).to.equal('100');
    expect(arc.getAttribute('stroke-dasharray')).to.equal('25 75');
  });

  it('inherits its colour from context via currentColor', async () => {
    const wrapper = await fixture(
      html`<div style="color: rgb(0, 128, 0)"><cdz-spinner></cdz-spinner></div>`
    );
    const el = wrapper.querySelector<CdzSpinner>('cdz-spinner')!;
    expect(getComputedStyle(el.shadowRoot!.querySelector('svg')!).stroke).to.equal(
      'rgb(0, 128, 0)'
    );
  });

  it('applies the size scale, and "inherit" tracks the font size', async () => {
    const md = await fixture<CdzSpinner>(html`<cdz-spinner></cdz-spinner>`);
    expect(getComputedStyle(md.shadowRoot!.querySelector('svg')!).width).to.equal('20px');

    const sm = await fixture<CdzSpinner>(html`<cdz-spinner size="sm"></cdz-spinner>`);
    expect(getComputedStyle(sm.shadowRoot!.querySelector('svg')!).width).to.equal('16px');

    const lg = await fixture<CdzSpinner>(html`<cdz-spinner size="lg"></cdz-spinner>`);
    expect(getComputedStyle(lg.shadowRoot!.querySelector('svg')!).width).to.equal('24px');

    const wrapper = await fixture(
      html`<div style="font-size: 40px"><cdz-spinner size="inherit"></cdz-spinner></div>`
    );
    const inherited = wrapper.querySelector<CdzSpinner>('cdz-spinner')!;
    expect(getComputedStyle(inherited.shadowRoot!.querySelector('svg')!).width).to.equal('40px');
  });

  it('animates by default', async () => {
    const el = await fixture<CdzSpinner>(html`<cdz-spinner></cdz-spinner>`);
    const styles = getComputedStyle(el.shadowRoot!.querySelector('svg')!);
    expect(styles.animationName).to.equal('cdz-spin');
    expect(styles.animationIterationCount).to.equal('infinite');
  });

  it('replaces rotation with a non-motion animation under reduced motion', async () => {
    // The rule can't be triggered from script, so this asserts the rule
    // itself: that it exists, targets the right query, and swaps the
    // animation for a different one rather than merely removing it — a
    // frozen ring would be indistinguishable from a broken one.
    const el = await fixture<CdzSpinner>(html`<cdz-spinner></cdz-spinner>`);
    const rule = findMediaRule(el, 'prefers-reduced-motion');
    expect(rule, 'no reduced-motion media rule found').to.not.be.null;
    expect(rule!.conditionText).to.contain('reduce');

    const cssText = Array.from(rule!.cssRules)
      .map((r) => r.cssText)
      .join(' ');
    expect(cssText).to.contain('cdz-pulse');
    // Word-bounded on purpose: a plain substring check matches the token
    // name --cdz-spinner-reduced-motion-duration, which legitimately
    // appears in this very rule. \b after "spin" needs a non-word char,
    // so "cdz-spinner" correctly fails to match.
    expect(/\bcdz-spin\b/.test(cssText), 'rotation should not survive here').to.be.false;
    expect(cssText).to.not.contain('animation: none');
  });

  it('defines both keyframe sets it switches between', async () => {
    const el = await fixture<CdzSpinner>(html`<cdz-spinner></cdz-spinner>`);
    const names = new Set<string>();
    for (const sheet of el.shadowRoot!.adoptedStyleSheets) {
      for (const rule of Array.from(sheet.cssRules)) {
        if (rule instanceof CSSKeyframesRule) names.add(rule.name);
      }
    }
    expect(names.has('cdz-spin')).to.be.true;
    expect(names.has('cdz-pulse')).to.be.true;
  });
});
