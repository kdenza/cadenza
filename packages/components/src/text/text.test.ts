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
});
