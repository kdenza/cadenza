import { html, fixture, expect } from '@open-wc/testing';
import './logo.js';
import type { CdzLogo } from './logo.js';

const VARIANTS = ['color', 'mono', 'outline'] as const;

function box(el: CdzLogo): HTMLElement {
  return el.shadowRoot!.querySelector('.logo')!;
}

function svg(el: CdzLogo): SVGElement {
  return el.shadowRoot!.querySelector('svg')!;
}

function petals(el: CdzLogo): NodeListOf<SVGPathElement> {
  return el.shadowRoot!.querySelectorAll('svg path');
}

describe('cdz-logo', () => {
  it('renders every variant without throwing', async () => {
    for (const variant of VARIANTS) {
      const el = await fixture<CdzLogo>(html`<cdz-logo variant=${variant}></cdz-logo>`);
      expect(svg(el), variant).to.exist;
    }
  });

  it('defaults to the color variant', async () => {
    const el = await fixture<CdzLogo>(html`<cdz-logo></cdz-logo>`);
    expect(el.variant).to.equal('color');
    expect(el.getAttribute('variant')).to.equal('color');
  });

  it('renders five petals and a centre at md and lg -- above the reduced-mark threshold', async () => {
    const md = await fixture<CdzLogo>(html`<cdz-logo size="md"></cdz-logo>`);
    expect(petals(md)).to.have.lengthOf(5);
    expect(md.shadowRoot!.querySelector('.center')).to.exist;
    expect(md.shadowRoot!.querySelector('.halo')).to.not.exist;

    const lg = await fixture<CdzLogo>(html`<cdz-logo size="lg"></cdz-logo>`);
    expect(petals(lg)).to.have.lengthOf(5);
  });

  it('replaces the flower with the reduced mark at sm -- below the 28px threshold', async () => {
    const el = await fixture<CdzLogo>(html`<cdz-logo size="sm"></cdz-logo>`);
    expect(petals(el)).to.have.lengthOf(0);
    expect(el.shadowRoot!.querySelector('.halo')).to.exist;
    expect(el.shadowRoot!.querySelector('.center')).to.exist;
  });

  it('reflects size so the sizing variable and the reduced-mark rule can key off it', async () => {
    const el = await fixture<CdzLogo>(html`<cdz-logo size="lg"></cdz-logo>`);
    expect(el.getAttribute('size')).to.equal('lg');
  });

  it('sets the painted dimensions from size', async () => {
    const sm = await fixture<CdzLogo>(html`<cdz-logo size="sm"></cdz-logo>`);
    expect(getComputedStyle(svg(sm)).width).to.equal('20px');

    const md = await fixture<CdzLogo>(html`<cdz-logo size="md"></cdz-logo>`);
    expect(getComputedStyle(svg(md)).width).to.equal('32px');

    const lg = await fixture<CdzLogo>(html`<cdz-logo size="lg"></cdz-logo>`);
    expect(getComputedStyle(svg(lg)).width).to.equal('44px');
  });

  it('carries the accessible name by default -- no wordmark, not decorative', async () => {
    const el = await fixture<CdzLogo>(html`<cdz-logo></cdz-logo>`);
    expect(box(el).getAttribute('role')).to.equal('img');
    expect(box(el).getAttribute('aria-label')).to.equal('Cadenza');
    expect(box(el).hasAttribute('aria-hidden')).to.be.false;
  });

  it('respects a custom label', async () => {
    const el = await fixture<CdzLogo>(html`<cdz-logo label="Jacaranda"></cdz-logo>`);
    expect(box(el).getAttribute('aria-label')).to.equal('Jacaranda');
  });

  it('goes silent on the mark once a wordmark is shown, so it does not say "Cadenza Cadenza"', async () => {
    const el = await fixture<CdzLogo>(html`<cdz-logo with-wordmark></cdz-logo>`);
    expect(box(el).hasAttribute('role')).to.be.false;
    expect(box(el).hasAttribute('aria-label')).to.be.false;
    expect(box(el).hasAttribute('aria-hidden')).to.be.false;
    expect(el.shadowRoot!.querySelector('.wordmark')!.textContent).to.equal('Cadenza');
  });

  it('is fully silenced when decorative', async () => {
    const el = await fixture<CdzLogo>(html`<cdz-logo decorative></cdz-logo>`);
    expect(box(el).getAttribute('aria-hidden')).to.equal('true');
    expect(box(el).hasAttribute('role')).to.be.false;
    expect(box(el).hasAttribute('aria-label')).to.be.false;
  });

  it('keeps the inner svg out of the accessibility tree either way', async () => {
    const withLabel = await fixture<CdzLogo>(html`<cdz-logo></cdz-logo>`);
    expect(svg(withLabel).getAttribute('aria-hidden')).to.equal('true');
    expect(svg(withLabel).getAttribute('focusable')).to.equal('false');

    const withWordmark = await fixture<CdzLogo>(html`<cdz-logo with-wordmark></cdz-logo>`);
    expect(svg(withWordmark).getAttribute('aria-hidden')).to.equal('true');
  });

  it('does not render a wordmark unless asked', async () => {
    const el = await fixture<CdzLogo>(html`<cdz-logo></cdz-logo>`);
    expect(el.shadowRoot!.querySelector('.wordmark')).to.not.exist;
  });

  it('stacks vertically only when asked, horizontally by default', async () => {
    const horizontal = await fixture<CdzLogo>(html`<cdz-logo with-wordmark></cdz-logo>`);
    expect(box(horizontal).classList.contains('orientation-vertical')).to.be.false;

    const vertical = await fixture<CdzLogo>(
      html`<cdz-logo with-wordmark orientation="vertical"></cdz-logo>`
    );
    expect(box(vertical).classList.contains('orientation-vertical')).to.be.true;
  });

  it('is accessible in every variant, with and without the wordmark, and decorative', async () => {
    for (const variant of VARIANTS) {
      const el = await fixture<CdzLogo>(html`<cdz-logo variant=${variant}></cdz-logo>`);
      await expect(el).to.be.accessible();
    }
    const withWordmark = await fixture<CdzLogo>(html`<cdz-logo with-wordmark></cdz-logo>`);
    await expect(withWordmark).to.be.accessible();
    const decorative = await fixture<CdzLogo>(html`<cdz-logo decorative></cdz-logo>`);
    await expect(decorative).to.be.accessible();
  });
});
