import { html, fixture, expect } from '@open-wc/testing';
import './switch.js';
import type { CdzSwitch } from './switch.js';

describe('cdz-switch', () => {
  it('associates the label with the input via for/id', async () => {
    const el = await fixture<CdzSwitch>(html`<cdz-switch label="Notificaciones"></cdz-switch>`);
    const label = el.shadowRoot!.querySelector('label')!;
    const input = el.shadowRoot!.querySelector('input')!;
    expect(label.getAttribute('for')).to.equal(input.id);
  });

  it('exposes role="switch" on top of a native checkbox', async () => {
    const el = await fixture<CdzSwitch>(html`<cdz-switch label="Notificaciones"></cdz-switch>`);
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.type).to.equal('checkbox');
    expect(input.getAttribute('role')).to.equal('switch');
  });

  it('is accessible off, on, and disabled', async () => {
    const el = await fixture<CdzSwitch>(html`<cdz-switch label="Notificaciones"></cdz-switch>`);
    await expect(el).to.be.accessible();

    el.checked = true;
    await el.updateComplete;
    await expect(el).to.be.accessible();

    el.disabled = true;
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it('exposes helper text via aria-describedby', async () => {
    const el = await fixture<CdzSwitch>(
      html`<cdz-switch label="Notificaciones" helper-text="Puedes cambiarlo cuando quieras"></cdz-switch>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.getAttribute('aria-describedby')).to.equal('helper-text');
  });

  it('switches to the error state: aria-invalid and aria-describedby', async () => {
    const el = await fixture<CdzSwitch>(
      html`<cdz-switch label="Notificaciones" error-message="Tienes que decidir"></cdz-switch>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.getAttribute('aria-invalid')).to.equal('true');
    expect(input.getAttribute('aria-describedby')).to.equal('error-text');
    await expect(el).to.be.accessible();
  });

  it('uses native disabled', async () => {
    const el = await fixture<CdzSwitch>(html`<cdz-switch label="Notificaciones" disabled></cdz-switch>`);
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.disabled).to.be.true;
    await expect(el).to.be.accessible();
  });

  it('fires a change event and updates checked when toggled', async () => {
    const el = await fixture<CdzSwitch>(html`<cdz-switch label="Notificaciones"></cdz-switch>`);
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
      await fixture<CdzSwitch>(html`<cdz-switch></cdz-switch>`);
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
      await fixture<CdzSwitch>(html`<cdz-switch label="Notificaciones"></cdz-switch>`);
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.equal(0);
  });
});
