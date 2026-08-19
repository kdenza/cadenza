import { html, fixture, expect } from '@open-wc/testing';
import './link.js';
import type { CdzLink } from './link.js';

describe('cdz-link', () => {
  it('renders a real anchor with the given href', async () => {
    const el = await fixture<CdzLink>(
      html`<cdz-link href="/contacto">Contactarme</cdz-link>`
    );
    const anchor = el.shadowRoot!.querySelector('a')!;
    expect(anchor.getAttribute('href')).to.equal('/contacto');
  });

  it('is accessible as a plain link and as a new-tab link', async () => {
    const el = await fixture<CdzLink>(html`<cdz-link href="/contacto">Contactarme</cdz-link>`);
    await expect(el).to.be.accessible();

    el.target = '_blank';
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it('adds rel="noopener" when opening a new tab', async () => {
    const el = await fixture<CdzLink>(
      html`<cdz-link href="https://example.com" target="_blank">Ejemplo</cdz-link>`
    );
    expect(el.shadowRoot!.querySelector('a')!.getAttribute('rel')).to.equal('noopener');
  });

  it('merges noopener into a consumer-provided rel instead of replacing it', async () => {
    const el = await fixture<CdzLink>(
      html`<cdz-link href="https://example.com" target="_blank" rel="nofollow">Ejemplo</cdz-link>`
    );
    const rel = el.shadowRoot!.querySelector('a')!.getAttribute('rel')!.split(' ');
    expect(rel).to.include('nofollow');
    expect(rel).to.include('noopener');
  });

  it('does not duplicate noopener when the consumer already passed it', async () => {
    const el = await fixture<CdzLink>(
      html`<cdz-link href="https://example.com" target="_blank" rel="noopener">Ejemplo</cdz-link>`
    );
    expect(el.shadowRoot!.querySelector('a')!.getAttribute('rel')).to.equal('noopener');
  });

  it('does not add rel when staying in the same tab', async () => {
    const el = await fixture<CdzLink>(html`<cdz-link href="/contacto">Contactarme</cdz-link>`);
    expect(el.shadowRoot!.querySelector('a')!.hasAttribute('rel')).to.be.false;
  });

  it('announces a new tab to assistive tech, and hides the icon from it', async () => {
    const el = await fixture<CdzLink>(
      html`<cdz-link href="https://example.com" target="_blank">Ejemplo</cdz-link>`
    );
    const note = el.shadowRoot!.querySelector('.sr-only')!;
    expect(note.textContent!.trim()).to.equal('(abre en una pestaña nueva)');
    // Visually hidden, but deliberately still in the accessibility tree.
    expect(getComputedStyle(note).display).to.not.equal('none');
    expect(getComputedStyle(note).visibility).to.not.equal('hidden');
    expect(el.shadowRoot!.querySelector('.external-icon')!.getAttribute('aria-hidden')).to.equal(
      'true'
    );
  });

  it('allows the new-tab note to be translated', async () => {
    const el = await fixture<CdzLink>(
      html`<cdz-link href="https://example.com" target="_blank" new-tab-label="(opens in a new tab)"
        >Example</cdz-link
      >`
    );
    expect(el.shadowRoot!.querySelector('.sr-only')!.textContent!.trim()).to.equal(
      '(opens in a new tab)'
    );
  });

  it('omits the new-tab affordances for same-tab links', async () => {
    const el = await fixture<CdzLink>(html`<cdz-link href="/contacto">Contactarme</cdz-link>`);
    expect(el.shadowRoot!.querySelector('.sr-only')).to.be.null;
    expect(el.shadowRoot!.querySelector('.external-icon')).to.be.null;
  });

  it('supports a valueless download as well as a renamed one', async () => {
    const bare = await fixture<CdzLink>(
      html`<cdz-link href="/cv.pdf" download="">Descargar</cdz-link>`
    );
    const bareAnchor = bare.shadowRoot!.querySelector('a')!;
    expect(bareAnchor.hasAttribute('download')).to.be.true;
    expect(bareAnchor.getAttribute('download')).to.equal('');

    const renamed = await fixture<CdzLink>(
      html`<cdz-link href="/cv.pdf" download="kyrah-cv.pdf">Descargar</cdz-link>`
    );
    expect(renamed.shadowRoot!.querySelector('a')!.getAttribute('download')).to.equal(
      'kyrah-cv.pdf'
    );
  });

  it('omits download entirely when not set', async () => {
    const el = await fixture<CdzLink>(html`<cdz-link href="/cv.pdf">Ver</cdz-link>`);
    expect(el.shadowRoot!.querySelector('a')!.hasAttribute('download')).to.be.false;
  });

  it('stays underlined, so colour is never the only link cue (WCAG 1.4.1)', async () => {
    const el = await fixture<CdzLink>(html`<cdz-link href="/contacto">Contactarme</cdz-link>`);
    const decoration = getComputedStyle(el.shadowRoot!.querySelector('a')!).textDecorationLine;
    expect(decoration).to.contain('underline');
  });

  it('warns loudly (console.error) when href is missing, without throwing', async () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      await fixture<CdzLink>(html`<cdz-link>Sin destino</cdz-link>`);
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.be.greaterThan(0);
    expect(String(calls[0][0])).to.include('href');
  });

  it('warns again if a valid href is later cleared', async () => {
    const el = await fixture<CdzLink>(html`<cdz-link href="/contacto">Contactarme</cdz-link>`);

    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      el.href = '';
      await el.updateComplete;
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.be.greaterThan(0);
  });

  it('does not warn when an href is provided', async () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      await fixture<CdzLink>(html`<cdz-link href="/contacto">Contactarme</cdz-link>`);
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.equal(0);
  });
});
