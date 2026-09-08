import { html, fixture, expect } from '@open-wc/testing';
import './page-nav.js';
import type { CdzPageNav, CdzPageNavSection } from './page-nav.js';

const SECTIONS: CdzPageNavSection[] = [
  { id: 'uno', label: 'Uno' },
  { id: 'dos', label: 'Dos' },
  { id: 'tres', label: 'Tres' }
];

async function build(extra = ''): Promise<CdzPageNav> {
  const el = await fixture<CdzPageNav>(
    html`<cdz-page-nav label="Secciones" ...=${''} .sections=${SECTIONS}></cdz-page-nav>`
  );
  if (extra) el.setAttribute(extra, '');
  await el.updateComplete;
  return el;
}

const nav = (el: CdzPageNav) => el.shadowRoot!.querySelector('nav')!;
const list = (el: CdzPageNav) => el.shadowRoot!.querySelector('ul')!;
const toggle = (el: CdzPageNav) => el.shadowRoot!.querySelector('cdz-button')!;
const links = (el: CdzPageNav) => Array.from(el.shadowRoot!.querySelectorAll('a'));

describe('cdz-page-nav', () => {
  it('is a nav landmark with an accessible name', async () => {
    const el = await build();
    // A nav without a name is indistinguishable from every other nav on
    // the page, which is the whole reason landmarks exist.
    expect(nav(el).getAttribute('aria-label')).to.equal('Secciones');
  });

  it('renders one link per section, pointing at its anchor', async () => {
    const el = await build();
    expect(links(el).map((a) => a.getAttribute('href'))).to.eql(['#uno', '#dos', '#tres']);
    expect(links(el).map((a) => a.textContent?.trim())).to.eql(['Uno', 'Dos', 'Tres']);
  });

  it('uses aria-current="location", not "page"', async () => {
    const el = await build();
    el.currentId = 'dos';
    await el.updateComplete;

    // These links point at sections of the document being read. "page"
    // would claim the reader is somewhere they are not.
    const current = links(el).filter((a) => a.hasAttribute('aria-current'));
    expect(current).to.have.lengthOf(1);
    expect(current[0].getAttribute('aria-current')).to.equal('location');
    expect(current[0].getAttribute('href')).to.equal('#dos');
  });

  it('marks nothing current when currentId matches no section', async () => {
    const el = await build();
    el.currentId = 'no-existe';
    await el.updateComplete;
    expect(links(el).filter((a) => a.hasAttribute('aria-current'))).to.be.empty;
  });

  it('wires the disclosure: aria-expanded and aria-controls point at the list', async () => {
    const el = await build();
    expect(toggle(el).getAttribute('aria-expanded')).to.equal('false');
    expect(toggle(el).getAttribute('aria-controls')).to.equal(list(el).id);
    expect(list(el).id).to.not.be.empty;
  });

  it('actually hides the list when collapsed', async () => {
    const el = await build();
    expect(list(el).hasAttribute('hidden')).to.be.true;

    // The attribute alone is not the assertion that matters: an author
    // display rule silently overrides the browser's
    // [hidden] { display: none }, which is exactly how this broke while
    // being built (ADR-0025, repeated in ADR-0027).
    //
    // Computed display cannot be asserted directly here, because above
    // the breakpoint a deliberate override keeps the list visible and the
    // test runner's window is wider than that. So the rules themselves
    // are read from the CSSOM — the same technique ADR-0018 used for
    // prefers-reduced-motion, and for the same reason: the behaviour is
    // conditional on an environment the test cannot set.
    // Read from the sheets actually adopted by the shadow root, the same
    // way spinner.test.ts does — `static styles` is a Lit CSSResult, not
    // a CSSStyleSheet, so it has no cssRules of its own.
    const rules = el.shadowRoot!.adoptedStyleSheets.flatMap((sheet) =>
      Array.from(sheet.cssRules)
    );

    const hideRule = rules.find(
      (r): r is CSSStyleRule =>
        r instanceof CSSStyleRule && r.selectorText === 'ul[hidden]'
    );
    expect(hideRule, 'no top-level ul[hidden] rule').to.exist;
    expect(hideRule!.style.display).to.equal('none');

    // And the counterpart: above the breakpoint the list comes back, so
    // resizing a window while collapsed cannot leave a desktop layout
    // with no navigation and no button to restore it.
    const media = rules.find(
      (r): r is CSSMediaRule =>
        r instanceof CSSMediaRule && r.conditionText.includes('48rem')
    );
    expect(media, 'no min-width: 48rem media rule').to.exist;
    const restore = Array.from(media!.cssRules).find(
      (r): r is CSSStyleRule =>
        r instanceof CSSStyleRule && r.selectorText === 'ul[hidden]'
    );
    expect(restore, 'collapsed list is never restored above the breakpoint').to.exist;
    expect(restore!.style.display).to.equal('flex');
  });

  it('toggles open and closed', async () => {
    const el = await build();
    const button = toggle(el).shadowRoot!.querySelector('button')!;

    button.click();
    await el.updateComplete;
    expect(toggle(el).getAttribute('aria-expanded')).to.equal('true');
    expect(list(el).hasAttribute('hidden')).to.be.false;

    button.click();
    await el.updateComplete;
    expect(toggle(el).getAttribute('aria-expanded')).to.equal('false');
    expect(list(el).hasAttribute('hidden')).to.be.true;
  });

  it('swaps the icon between menu and x', async () => {
    const el = await build();
    const icon = () => el.shadowRoot!.querySelector('cdz-icon')!.getAttribute('name');
    expect(icon()).to.equal('menu');

    toggle(el).shadowRoot!.querySelector('button')!.click();
    await el.updateComplete;
    expect(icon()).to.equal('x');
  });

  it('collapses after following a link, so the target is not covered', async () => {
    const el = await build();
    toggle(el).shadowRoot!.querySelector('button')!.click();
    await el.updateComplete;
    expect(list(el).hasAttribute('hidden')).to.be.false;

    links(el)[0].click();
    await el.updateComplete;
    expect(list(el).hasAttribute('hidden')).to.be.true;
  });

  it('renders no toggle when there are no sections', async () => {
    const el = await fixture<CdzPageNav>(html`<cdz-page-nav label="Vacío"></cdz-page-nav>`);
    // A disclosure controlling an empty list is a control with nothing to
    // do, and it would still take a tab stop.
    expect(el.shadowRoot!.querySelector('cdz-button')).to.not.exist;
  });

  it('warns when the landmark has no name', async () => {
    const errors: unknown[][] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => errors.push(args);
    try {
      await fixture<CdzPageNav>(html`<cdz-page-nav .sections=${SECTIONS}></cdz-page-nav>`);
    } finally {
      console.error = original;
    }
    expect(errors).to.have.lengthOf.at.least(1);
    expect(String(errors[0][0])).to.include('"label" is required');
  });

  it('is accessible collapsed, expanded and with a current item', async () => {
    const el = await build();
    await expect(el).to.be.accessible();

    toggle(el).shadowRoot!.querySelector('button')!.click();
    await el.updateComplete;
    await expect(el).to.be.accessible();

    el.currentId = 'dos';
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });
});
