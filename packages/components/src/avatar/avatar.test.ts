import { html, fixture, fixtureSync, expect, oneEvent } from '@open-wc/testing';
import './avatar.js';
import { initialsFrom, type CdzAvatar } from './avatar.js';

function box(el: CdzAvatar): HTMLElement {
  return el.shadowRoot!.querySelector('.avatar')!;
}

function initials(el: CdzAvatar): HTMLElement | null {
  return el.shadowRoot!.querySelector('.initials');
}

function icon(el: CdzAvatar): Element | null {
  return el.shadowRoot!.querySelector('cdz-icon');
}

function image(el: CdzAvatar): HTMLImageElement | null {
  return el.shadowRoot!.querySelector('img');
}

// A 1x1 transparent PNG, inline so the tests never touch the network.
const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// A src that always fails, inline for the same reason. It claims to be a
// PNG and isn't, so decoding fails immediately and locally.
//
// The obvious alternative -- pointing at a URL that 404s -- makes the test
// wait on a server round trip. Measured in the browser: the round trip
// settles in ~4.8ms against ~0.3ms here, and only the first of those can
// stretch past the runner's timeout when the machine is busy. The
// component cannot tell the two apart anyway; all it sees is `error`.
const IMAGEN_ROTA = 'data:image/png;base64,esto-no-es-png';

describe('initialsFrom', () => {
  it('takes the first and last word, skipping particles for free', () => {
    expect(initialsFrom('Kyrah Monreal')).to.equal('KM');
    expect(initialsFrom('Ana de la Cruz')).to.equal('AC');
  });

  it('returns a single initial for a single-word name', () => {
    expect(initialsFrom('Kyrah')).to.equal('K');
  });

  it('keeps a combining mark attached to its base letter', () => {
    // Written with explicit escapes rather than literal characters: the two
    // encodings of "n-tilde" are indistinguishable on screen, so a literal
    // here would quietly test whatever the editor happened to save.
    const descompuesto = 'n\u0303ora garci\u0301a';
    // Slicing by code point returns a bare N and drops the tilde, which is
    // why this uses Intl.Segmenter and not Array.from.
    expect(initialsFrom(descompuesto)).to.equal('\u00d1G');
  });

  it('normalises its output, so one name gives one string in either encoding', () => {
    // Same name, both Unicode encodings. They render identically and compare
    // as different, which is exactly how this bit users: the component
    // normalises to NFC so callers never have to care.
    expect(initialsFrom('n\u0303ora garci\u0301a')).to.equal(initialsFrom('\u00f1ora garc\u00eda'));
  });

  it('keeps a whole grapheme cluster together', () => {
    // The first cluster of this name is three code points that render as
    // one letter; cutting it produces a different letter, not a shorter one.
    expect(initialsFrom('क्षमा शर्मा')).to.equal('क्षश');
  });

  it('survives an astral-plane first character', () => {
    expect(initialsFrom('🌸 Flor')).to.equal('🌸F');
  });

  it('collapses stray whitespace instead of producing blank initials', () => {
    expect(initialsFrom('   Kyrah    Monreal  ')).to.equal('KM');
    expect(initialsFrom('   ')).to.equal('');
    expect(initialsFrom('')).to.equal('');
  });
});

describe('cdz-avatar', () => {
  it('shows initials by default', async () => {
    const el = await fixture<CdzAvatar>(html`<cdz-avatar name="Kyrah Monreal"></cdz-avatar>`);
    expect(initials(el)!.textContent).to.equal('KM');
    expect(icon(el)).to.not.exist;
  });

  it('shows the generic person icon when asked', async () => {
    const el = await fixture<CdzAvatar>(
      html`<cdz-avatar name="Kyrah Monreal" fallback="icon"></cdz-avatar>`
    );
    expect(icon(el)).to.exist;
    expect(initials(el)).to.not.exist;
  });

  it('falls through to the icon when initials were asked for but the name yields none', async () => {
    const el = await fixture<CdzAvatar>(html`<cdz-avatar decorative></cdz-avatar>`);
    expect(icon(el)).to.exist;
  });

  it('renders the photo over the fallback, so nothing shifts when it arrives', async () => {
    const el = await fixture<CdzAvatar>(
      html`<cdz-avatar name="Kyrah Monreal" src=${PIXEL}></cdz-avatar>`
    );
    expect(image(el)).to.exist;
    // The fallback stays mounted underneath rather than being swapped in
    // only on failure -- that is what removes the blank flash while loading.
    expect(initials(el)).to.exist;
  });

  it('drops back to the fallback when the photo fails to load', async () => {
    const el = await fixture<CdzAvatar>(
      html`<cdz-avatar name="Kyrah Monreal" src=${IMAGEN_ROTA}></cdz-avatar>`
    );
    await oneEvent(image(el)!, 'error');
    await el.updateComplete;

    expect(image(el)).to.not.exist;
    expect(initials(el)!.textContent).to.equal('KM');
  });

  it('gives a new src its own chance — one broken photo does not poison the next', async () => {
    const el = await fixture<CdzAvatar>(
      html`<cdz-avatar name="Kyrah Monreal" src=${IMAGEN_ROTA}></cdz-avatar>`
    );
    await oneEvent(image(el)!, 'error');
    await el.updateComplete;
    expect(image(el)).to.not.exist;

    el.src = PIXEL;
    await el.updateComplete;
    expect(image(el)).to.exist;
  });

  it('treats an empty src as "no photo", never rendering an img that would error', async () => {
    // Assigning src="" to an <img> fires `error`, so the empty case has to
    // be kept away from the element entirely rather than handled by it.
    const el = await fixture<CdzAvatar>(html`<cdz-avatar name="Kyrah Monreal" src=""></cdz-avatar>`);
    expect(image(el)).to.not.exist;
  });

  it('carries the person name by default — the loud option, because it is not a guess', async () => {
    const el = await fixture<CdzAvatar>(html`<cdz-avatar name="Kyrah Monreal"></cdz-avatar>`);
    expect(box(el).getAttribute('role')).to.equal('img');
    expect(box(el).getAttribute('aria-label')).to.equal('Kyrah Monreal');
    expect(box(el).hasAttribute('aria-hidden')).to.be.false;
  });

  it('goes silent when the name is already printed beside it', async () => {
    const el = await fixture<CdzAvatar>(
      html`<cdz-avatar name="Kyrah Monreal" decorative></cdz-avatar>`
    );
    expect(box(el).getAttribute('aria-hidden')).to.equal('true');
    expect(box(el).hasAttribute('role')).to.be.false;
    expect(box(el).hasAttribute('aria-label')).to.be.false;
  });

  it('switches between announced and silent at runtime', async () => {
    const el = await fixture<CdzAvatar>(html`<cdz-avatar name="Kyrah Monreal"></cdz-avatar>`);
    expect(box(el).getAttribute('role')).to.equal('img');

    el.decorative = true;
    await el.updateComplete;
    expect(box(el).getAttribute('aria-hidden')).to.equal('true');

    el.decorative = false;
    await el.updateComplete;
    expect(box(el).getAttribute('aria-label')).to.equal('Kyrah Monreal');
  });

  it('never announces the initials themselves — "KM" is not a name', async () => {
    const el = await fixture<CdzAvatar>(html`<cdz-avatar name="Kyrah Monreal"></cdz-avatar>`);
    // role="img" makes the subtree presentational, so the label is the only
    // thing exposed; the alt is empty for the same reason.
    expect(box(el).getAttribute('role')).to.equal('img');
    const el2 = await fixture<CdzAvatar>(
      html`<cdz-avatar name="Kyrah Monreal" src=${PIXEL}></cdz-avatar>`
    );
    expect(image(el2)!.getAttribute('alt')).to.equal('');
  });

  it('stays a circle rather than an ellipse when squeezed in a flex row', async () => {
    // fixtureSync, not fixture, and deliberately so. The async `fixture`
    // awaits `elementUpdated` on whatever it mounts; for a custom element
    // that is `el.updateComplete` (a microtask), but a plain <div> has no
    // such hook, so it falls back to `nextFrame()` --
    // i.e. requestAnimationFrame. That made this the only test in the suite
    // whose result depended on the browser choosing to paint, and under load
    // it timed out at mocha's 2s while every other test sailed through.
    //
    // Awaiting the avatar's own updateComplete is the guarantee that
    // actually matters here, and getBoundingClientRect forces layout
    // synchronously, so no frame is needed at all.
    const row = fixtureSync<HTMLElement>(html`
      <div style="display:flex; width:60px">
        <cdz-avatar name="Kyrah Monreal"></cdz-avatar>
        <span style="flex:1">un nombre muy largo que empuja</span>
      </div>
    `);
    const el = row.querySelector<CdzAvatar>('cdz-avatar')!;
    await el.updateComplete;
    const rect = box(el).getBoundingClientRect();
    expect(Math.round(rect.width)).to.equal(Math.round(rect.height));
  });

  it('scales the box with size', async () => {
    const small = await fixture<CdzAvatar>(html`<cdz-avatar name="K M" size="sm"></cdz-avatar>`);
    const large = await fixture<CdzAvatar>(html`<cdz-avatar name="K M" size="lg"></cdz-avatar>`);
    expect(box(large).getBoundingClientRect().width).to.be.greaterThan(
      box(small).getBoundingClientRect().width
    );
  });

  it('is accessible in every combination of fallback and announcement', async () => {
    for (const markup of [
      html`<cdz-avatar name="Kyrah Monreal"></cdz-avatar>`,
      html`<cdz-avatar name="Kyrah Monreal" decorative></cdz-avatar>`,
      html`<cdz-avatar name="Kyrah Monreal" fallback="icon"></cdz-avatar>`,
      html`<cdz-avatar name="Kyrah Monreal" fallback="icon" decorative></cdz-avatar>`,
      html`<cdz-avatar name="Kyrah Monreal" src=${PIXEL}></cdz-avatar>`
    ]) {
      const el = await fixture<CdzAvatar>(markup);
      await expect(el).to.be.accessible();
    }
  });
});
