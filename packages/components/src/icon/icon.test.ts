import { html, fixture, expect } from '@open-wc/testing';
import './icon.js';
import type { CdzIcon } from './icon.js';
import { icons, ICON_GRID } from '../shared/icons.js';

describe('cdz-icon', () => {
  it('renders the registry paths for the given name', async () => {
    const el = await fixture<CdzIcon>(html`<cdz-icon name="check"></cdz-icon>`);
    const paths = el.shadowRoot!.querySelectorAll('path');
    expect(paths.length).to.equal(icons.check.paths.length);
    expect(paths[0].getAttribute('d')).to.equal(icons.check.paths[0]);
  });

  it('renders every icon in the registry on the shared grid', async () => {
    // Guards the grid rule itself: a new icon added with a different
    // viewBox would silently break optical consistency across the set.
    for (const name of Object.keys(icons)) {
      const el = await fixture<CdzIcon>(html`<cdz-icon name=${name}></cdz-icon>`);
      const svg = el.shadowRoot!.querySelector('svg')!;
      expect(svg.getAttribute('viewBox'), name).to.equal(`0 0 ${ICON_GRID} ${ICON_GRID}`);
    }
  });

  it('is decorative by default: hidden from assistive tech, no role', async () => {
    const el = await fixture<CdzIcon>(html`<cdz-icon name="check"></cdz-icon>`);
    const svg = el.shadowRoot!.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).to.equal('true');
    expect(svg.hasAttribute('role')).to.be.false;
    expect(svg.hasAttribute('aria-label')).to.be.false;
  });

  it('becomes meaningful when given a label', async () => {
    const el = await fixture<CdzIcon>(
      html`<cdz-icon name="check" label="Completado"></cdz-icon>`
    );
    const svg = el.shadowRoot!.querySelector('svg')!;
    expect(svg.getAttribute('role')).to.equal('img');
    expect(svg.getAttribute('aria-label')).to.equal('Completado');
    expect(svg.hasAttribute('aria-hidden')).to.be.false;
  });

  it('switches between decorative and meaningful when the label changes', async () => {
    const el = await fixture<CdzIcon>(html`<cdz-icon name="check"></cdz-icon>`);
    expect(el.shadowRoot!.querySelector('svg')!.getAttribute('aria-hidden')).to.equal('true');

    el.label = 'Completado';
    await el.updateComplete;
    let svg = el.shadowRoot!.querySelector('svg')!;
    expect(svg.getAttribute('role')).to.equal('img');
    expect(svg.hasAttribute('aria-hidden')).to.be.false;

    el.label = '';
    await el.updateComplete;
    svg = el.shadowRoot!.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).to.equal('true');
    expect(svg.hasAttribute('role')).to.be.false;
  });

  it('treats a whitespace-only label as decorative, not meaningful', async () => {
    const el = await fixture<CdzIcon>(html`<cdz-icon name="check" label="   "></cdz-icon>`);
    const svg = el.shadowRoot!.querySelector('svg')!;
    expect(svg.getAttribute('aria-hidden')).to.equal('true');
    expect(svg.hasAttribute('role')).to.be.false;
  });

  it('is accessible both decorative and meaningful', async () => {
    const decorative = await fixture<CdzIcon>(html`<cdz-icon name="check"></cdz-icon>`);
    await expect(decorative).to.be.accessible();

    const meaningful = await fixture<CdzIcon>(
      html`<cdz-icon name="external-link" label="Abre en una pestaña nueva"></cdz-icon>`
    );
    await expect(meaningful).to.be.accessible();
  });

  it('paints with currentColor so it inherits the surrounding text colour', async () => {
    const wrapper = await fixture(
      html`<div style="color: rgb(0, 128, 0)"><cdz-icon name="check"></cdz-icon></div>`
    );
    const el = wrapper.querySelector<CdzIcon>('cdz-icon')!;
    const svg = el.shadowRoot!.querySelector('svg')!;
    expect(getComputedStyle(svg).stroke).to.equal('rgb(0, 128, 0)');
    expect(getComputedStyle(svg).fill).to.equal('none');
  });

  it('applies the size scale, and "inherit" tracks the font size', async () => {
    const md = await fixture<CdzIcon>(html`<cdz-icon name="check"></cdz-icon>`);
    expect(getComputedStyle(md.shadowRoot!.querySelector('svg')!).width).to.equal('20px');

    const sm = await fixture<CdzIcon>(html`<cdz-icon name="check" size="sm"></cdz-icon>`);
    expect(getComputedStyle(sm.shadowRoot!.querySelector('svg')!).width).to.equal('16px');

    const lg = await fixture<CdzIcon>(html`<cdz-icon name="check" size="lg"></cdz-icon>`);
    expect(getComputedStyle(lg.shadowRoot!.querySelector('svg')!).width).to.equal('24px');

    const wrapper = await fixture(
      html`<div style="font-size: 32px">
        <cdz-icon name="check" size="inherit"></cdz-icon>
      </div>`
    );
    const inherited = wrapper.querySelector<CdzIcon>('cdz-icon')!;
    expect(getComputedStyle(inherited.shadowRoot!.querySelector('svg')!).width).to.equal('32px');
  });

  it('renders nothing and warns loudly for an unknown icon name', async () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    let el: CdzIcon;
    try {
      el = await fixture<CdzIcon>(html`<cdz-icon name="no-existe"></cdz-icon>`);
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.be.greaterThan(0);
    expect(String(calls[0][0])).to.include('no-existe');
    expect(el!.shadowRoot!.querySelector('svg')).to.be.null;
  });

  it('does not warn for an empty name (nothing requested yet)', async () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      await fixture<CdzIcon>(html`<cdz-icon></cdz-icon>`);
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.equal(0);
  });
});
