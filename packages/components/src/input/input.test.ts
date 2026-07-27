import { html, fixture, expect } from '@open-wc/testing';
import './input.js';
import type { CdzInput } from './input.js';

describe('cdz-input', () => {
  it('associates the label with the input via for/id', async () => {
    const el = await fixture<CdzInput>(html`<cdz-input label="Correo"></cdz-input>`);
    const label = el.shadowRoot!.querySelector('label')!;
    const input = el.shadowRoot!.querySelector('input')!;
    expect(label.getAttribute('for')).to.equal(input.id);
  });

  it('is accessible in its default state', async () => {
    const el = await fixture<CdzInput>(html`<cdz-input label="Correo"></cdz-input>`);
    await expect(el).to.be.accessible();
  });

  it('exposes helper text via aria-describedby', async () => {
    const el = await fixture<CdzInput>(
      html`<cdz-input label="Correo" helper-text="Nunca lo compartimos"></cdz-input>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.getAttribute('aria-describedby')).to.equal('helper-text');
    expect(el.shadowRoot!.getElementById('helper-text')!.textContent).to.equal(
      'Nunca lo compartimos'
    );
  });

  it('switches to the error state: aria-invalid, aria-describedby, and is still accessible', async () => {
    const el = await fixture<CdzInput>(
      html`<cdz-input
        label="Correo"
        helper-text="Nunca lo compartimos"
        error-message="Correo inválido"
      ></cdz-input>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.getAttribute('aria-invalid')).to.equal('true');
    expect(input.getAttribute('aria-describedby')).to.equal('error-text');
    expect(el.shadowRoot!.getElementById('helper-text')).to.be.null;
    await expect(el).to.be.accessible();
  });

  it('reflects required as a native attribute (announced by AT natively)', async () => {
    const el = await fixture<CdzInput>(html`<cdz-input label="Correo" required></cdz-input>`);
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.hasAttribute('required')).to.be.true;
  });

  it('uses native disabled, unlike cdz-button — the field should drop out of form submission', async () => {
    const el = await fixture<CdzInput>(html`<cdz-input label="Correo" disabled></cdz-input>`);
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.disabled).to.be.true;
    await expect(el).to.be.accessible();
  });

  it('warns loudly (console.error) when label is missing, without throwing', async () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      await fixture<CdzInput>(html`<cdz-input></cdz-input>`);
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
      await fixture<CdzInput>(html`<cdz-input label="Correo"></cdz-input>`);
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.equal(0);
  });

  it('warns again if a valid label is later cleared', async () => {
    const el = await fixture<CdzInput>(html`<cdz-input label="Correo"></cdz-input>`);

    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      el.label = '';
      await el.updateComplete;
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.be.greaterThan(0);
  });

  it('fires input/change events with the current value', async () => {
    const el = await fixture<CdzInput>(html`<cdz-input label="Correo"></cdz-input>`);
    const input = el.shadowRoot!.querySelector('input')!;

    let lastInputValue = '';
    el.addEventListener('input', () => {
      lastInputValue = el.value;
    });

    input.value = 'hola@cadenza.dev';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(lastInputValue).to.equal('hola@cadenza.dev');
    expect(el.value).to.equal('hola@cadenza.dev');
  });
});
