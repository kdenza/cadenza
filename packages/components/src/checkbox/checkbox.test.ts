import { html, fixture, expect } from '@open-wc/testing';
import './checkbox.js';
import type { CdzCheckbox } from './checkbox.js';

describe('cdz-checkbox', () => {
  it('associates the label with the input via for/id', async () => {
    const el = await fixture<CdzCheckbox>(
      html`<cdz-checkbox label="Acepto los términos"></cdz-checkbox>`
    );
    const label = el.shadowRoot!.querySelector('label')!;
    const input = el.shadowRoot!.querySelector('input')!;
    expect(label.getAttribute('for')).to.equal(input.id);
  });

  it('is accessible unchecked, checked, and indeterminate', async () => {
    const el = await fixture<CdzCheckbox>(
      html`<cdz-checkbox label="Acepto los términos"></cdz-checkbox>`
    );
    await expect(el).to.be.accessible();

    el.checked = true;
    await el.updateComplete;
    await expect(el).to.be.accessible();

    el.checked = false;
    el.indeterminate = true;
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it('sets the native .indeterminate property imperatively (no HTML attribute equivalent)', async () => {
    const el = await fixture<CdzCheckbox>(
      html`<cdz-checkbox label="Acepto los términos" indeterminate></cdz-checkbox>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.indeterminate).to.be.true;
    expect(input.hasAttribute('indeterminate')).to.be.false;
  });

  it('clears indeterminate on interaction, like a native checkbox', async () => {
    const el = await fixture<CdzCheckbox>(
      html`<cdz-checkbox label="Acepto los términos" indeterminate></cdz-checkbox>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await el.updateComplete;
    expect(el.indeterminate).to.be.false;
    expect(el.checked).to.be.true;
  });

  it('exposes helper text via aria-describedby', async () => {
    const el = await fixture<CdzCheckbox>(
      html`<cdz-checkbox
        label="Acepto los términos"
        helper-text="Puedes darte de baja cuando quieras"
      ></cdz-checkbox>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.getAttribute('aria-describedby')).to.equal('helper-text');
  });

  it('switches to the error state: aria-invalid and aria-describedby', async () => {
    const el = await fixture<CdzCheckbox>(
      html`<cdz-checkbox
        label="Acepto los términos"
        error-message="Debes aceptar para continuar"
      ></cdz-checkbox>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.getAttribute('aria-invalid')).to.equal('true');
    expect(input.getAttribute('aria-describedby')).to.equal('error-text');
    await expect(el).to.be.accessible();
  });

  it('uses native disabled', async () => {
    const el = await fixture<CdzCheckbox>(
      html`<cdz-checkbox label="Acepto los términos" disabled></cdz-checkbox>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.disabled).to.be.true;
    await expect(el).to.be.accessible();
  });

  it('fires a change event and updates checked when toggled', async () => {
    const el = await fixture<CdzCheckbox>(
      html`<cdz-checkbox label="Acepto los términos"></cdz-checkbox>`
    );
    const input = el.shadowRoot!.querySelector('input')!;

    let changeFired = false;
    el.addEventListener('change', () => {
      changeFired = true;
    });

    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));

    expect(changeFired).to.be.true;
    expect(el.checked).to.be.true;
  });

  it('warns loudly (console.error) when label is missing, without throwing', async () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      await fixture<CdzCheckbox>(html`<cdz-checkbox></cdz-checkbox>`);
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
      await fixture<CdzCheckbox>(html`<cdz-checkbox label="Acepto los términos"></cdz-checkbox>`);
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.equal(0);
  });
});
