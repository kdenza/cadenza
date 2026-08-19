import { html, fixture, expect } from '@open-wc/testing';
import './textarea.js';
import type { CdzTextarea } from './textarea.js';

describe('cdz-textarea', () => {
  it('associates the label with the textarea via for/id', async () => {
    const el = await fixture<CdzTextarea>(html`<cdz-textarea label="Mensaje"></cdz-textarea>`);
    const label = el.shadowRoot!.querySelector('label')!;
    const textarea = el.shadowRoot!.querySelector('textarea')!;
    expect(label.getAttribute('for')).to.equal(textarea.id);
  });

  it('is accessible in its default state', async () => {
    const el = await fixture<CdzTextarea>(html`<cdz-textarea label="Mensaje"></cdz-textarea>`);
    await expect(el).to.be.accessible();
  });

  it('defaults rows to 4 and reflects a custom value as a native attribute', async () => {
    const el = await fixture<CdzTextarea>(html`<cdz-textarea label="Mensaje"></cdz-textarea>`);
    const textarea = el.shadowRoot!.querySelector('textarea')!;
    expect(textarea.rows).to.equal(4);

    el.rows = 8;
    await el.updateComplete;
    expect(textarea.rows).to.equal(8);
  });

  it('exposes helper text via aria-describedby', async () => {
    const el = await fixture<CdzTextarea>(
      html`<cdz-textarea label="Mensaje" helper-text="Máximo 500 caracteres"></cdz-textarea>`
    );
    const textarea = el.shadowRoot!.querySelector('textarea')!;
    expect(textarea.getAttribute('aria-describedby')).to.equal('helper-text');
    expect(el.shadowRoot!.getElementById('helper-text')!.textContent).to.equal(
      'Máximo 500 caracteres'
    );
  });

  it('switches to the error state: aria-invalid, aria-describedby, and is still accessible', async () => {
    const el = await fixture<CdzTextarea>(
      html`<cdz-textarea
        label="Mensaje"
        helper-text="Máximo 500 caracteres"
        error-message="El mensaje es obligatorio"
      ></cdz-textarea>`
    );
    const textarea = el.shadowRoot!.querySelector('textarea')!;
    expect(textarea.getAttribute('aria-invalid')).to.equal('true');
    expect(textarea.getAttribute('aria-describedby')).to.equal('error-text');
    expect(el.shadowRoot!.getElementById('helper-text')).to.be.null;
    await expect(el).to.be.accessible();
  });

  it('reflects required as a native attribute (announced by AT natively)', async () => {
    const el = await fixture<CdzTextarea>(html`<cdz-textarea label="Mensaje" required></cdz-textarea>`);
    const textarea = el.shadowRoot!.querySelector('textarea')!;
    expect(textarea.hasAttribute('required')).to.be.true;
  });

  it('uses native disabled — the field should drop out of form submission', async () => {
    const el = await fixture<CdzTextarea>(html`<cdz-textarea label="Mensaje" disabled></cdz-textarea>`);
    const textarea = el.shadowRoot!.querySelector('textarea')!;
    expect(textarea.disabled).to.be.true;
    await expect(el).to.be.accessible();
  });

  it('warns loudly (console.error) when label is missing, without throwing', async () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      await fixture<CdzTextarea>(html`<cdz-textarea></cdz-textarea>`);
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.be.greaterThan(0);
    expect(String(calls[0][0])).to.include('label');
  });

  it('does not warn when a label is provided', async () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      await fixture<CdzTextarea>(html`<cdz-textarea label="Mensaje"></cdz-textarea>`);
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.equal(0);
  });

  it('fires input/change events with the current value', async () => {
    const el = await fixture<CdzTextarea>(html`<cdz-textarea label="Mensaje"></cdz-textarea>`);
    const textarea = el.shadowRoot!.querySelector('textarea')!;

    let lastInputValue = '';
    el.addEventListener('input', () => {
      lastInputValue = el.value;
    });

    textarea.value = 'Hola desde Cadenza';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    expect(lastInputValue).to.equal('Hola desde Cadenza');
    expect(el.value).to.equal('Hola desde Cadenza');
  });
});
