import { html, fixture, expect } from '@open-wc/testing';
import './text.js';
import type { CdzText, CdzTextAs } from './text.js';

describe('cdz-text', () => {
  it('defaults to <p> with body-md sizing when as/size are omitted', async () => {
    const el = await fixture<CdzText>(html`<cdz-text>Hola</cdz-text>`);
    const rendered = el.shadowRoot!.firstElementChild!;
    expect(rendered.tagName).to.equal('P');
    expect(rendered.className).to.include('size-body-md');
  });

  it('renders the tag given via "as"', async () => {
    const el = await fixture<CdzText>(html`<cdz-text as="h2">Título</cdz-text>`);
    const rendered = el.shadowRoot!.firstElementChild!;
    expect(rendered.tagName).to.equal('H2');
  });

  it('defaults size from "as" when size is not set', async () => {
    const el = await fixture<CdzText>(html`<cdz-text as="h2">Título</cdz-text>`);
    const rendered = el.shadowRoot!.firstElementChild!;
    expect(rendered.className).to.include('size-heading-2');
  });

  it('lets "size" override the default independently of "as" — the whole point of the split', async () => {
    const el = await fixture<CdzText>(
      html`<cdz-text as="h2" size="body-md">Subtítulo discreto</cdz-text>`
    );
    const rendered = el.shadowRoot!.firstElementChild!;
    expect(rendered.tagName).to.equal('H2');
    expect(rendered.className).to.include('size-body-md');
  });

  it('projects slotted content', async () => {
    const el = await fixture<CdzText>(html`<cdz-text>Contenido de ejemplo</cdz-text>`);
    expect(el.textContent?.trim()).to.equal('Contenido de ejemplo');
  });

  it('is accessible across every "as" value', async () => {
    const tags: CdzTextAs[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'];
    for (const as of tags) {
      const el = await fixture<CdzText>(html`<cdz-text .as=${as}>Contenido</cdz-text>`);
      await expect(el).to.be.accessible();
    }
  });

  it('renders headings inside an open shadow root, discoverable by AT (not hidden by Shadow DOM)', async () => {
    const el = await fixture<CdzText>(html`<cdz-text as="h2">Sección</cdz-text>`);
    const heading = el.shadowRoot!.querySelector('h2')!;
    expect(heading).to.exist;
    expect(el.shadowRoot!.mode).to.equal('open');
  });
  it('is loud about an unknown "as", and still renders something sane', async () => {
    // It used to fall through the switch to <p> without a word, and
    // produce class="text size-undefined" -- a class matching no rule, so
    // the text rendered with no typographic style and nothing said why.
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    let el: CdzText;
    try {
      el = await fixture<CdzText>(html`<cdz-text as="marquee">Hola</cdz-text>`);
    } finally {
      console.error = originalError;
    }

    expect(calls.length, 'a misused prop is loud, never silent').to.be.greaterThan(0);
    expect(String(calls[0][0])).to.include('"as" must be one of');

    const rendered = el!.shadowRoot!.querySelector('p')!;
    expect(rendered, 'falls back to a real <p>').to.exist;
    expect(rendered.className, 'and takes <p>\'s size with it').to.equal('text size-body-md');
  });
});
