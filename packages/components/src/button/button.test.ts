import { html, fixture, expect } from '@open-wc/testing';
import './button.js';
import type { CdzButton } from './button.js';

describe('cdz-button', () => {
  it('renders slotted content', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button>Enviar</cdz-button>`);
    expect(el.textContent?.trim()).to.equal('Enviar');
  });

  it('defaults to type="button" so it never accidentally submits a form', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button>Enviar</cdz-button>`);
    const button = el.shadowRoot!.querySelector('button')!;
    expect(button.getAttribute('type')).to.equal('button');
  });

  it('is accessible in its default state', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button>Enviar</cdz-button>`);
    await expect(el).to.be.accessible();
  });

  it('is accessible in its disabled state', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button disabled>Enviar</cdz-button>`);
    await expect(el).to.be.accessible();
  });

  it('reflects disabled as aria-disabled without using the native disabled attribute', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button disabled>Enviar</cdz-button>`);
    const button = el.shadowRoot!.querySelector('button')!;
    expect(button.getAttribute('aria-disabled')).to.equal('true');
    expect(button.hasAttribute('disabled')).to.be.false;
  });

  it('stays focusable when disabled', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button disabled>Enviar</cdz-button>`);
    const button = el.shadowRoot!.querySelector('button')!;
    button.focus();
    expect(el.shadowRoot!.activeElement).to.equal(button);
  });

  it('blocks clicks while disabled', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button disabled>Enviar</cdz-button>`);
    const button = el.shadowRoot!.querySelector('button')!;
    let clicked = false;
    el.addEventListener('click', () => {
      clicked = true;
    });
    button.click();
    expect(clicked).to.be.false;
  });

  it('fires a click event when enabled', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button>Enviar</cdz-button>`);
    const button = el.shadowRoot!.querySelector('button')!;
    let clicked = false;
    el.addEventListener('click', () => {
      clicked = true;
    });
    button.click();
    expect(clicked).to.be.true;
  });
});
