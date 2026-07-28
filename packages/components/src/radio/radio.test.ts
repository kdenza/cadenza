import { html, fixture, expect } from '@open-wc/testing';
import './radio.js';
import type { CdzRadio } from './radio.js';

describe('cdz-radio', () => {
  it('associates the label with the input via for/id', async () => {
    const el = await fixture<CdzRadio>(html`<cdz-radio label="Opción A"></cdz-radio>`);
    const label = el.shadowRoot!.querySelector('label')!;
    const input = el.shadowRoot!.querySelector('input')!;
    expect(label.getAttribute('for')).to.equal(input.id);
  });

  it('is accessible unchecked and checked', async () => {
    const el = await fixture<CdzRadio>(html`<cdz-radio label="Opción A"></cdz-radio>`);
    await expect(el).to.be.accessible();

    el.checked = true;
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it('exposes helper text via aria-describedby', async () => {
    const el = await fixture<CdzRadio>(
      html`<cdz-radio label="Opción A" helper-text="Puedes cambiarla luego"></cdz-radio>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.getAttribute('aria-describedby')).to.equal('helper-text');
  });

  it('switches to the error state: aria-invalid and aria-describedby', async () => {
    const el = await fixture<CdzRadio>(
      html`<cdz-radio label="Opción A" error-message="Elegí una opción"></cdz-radio>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.getAttribute('aria-invalid')).to.equal('true');
    expect(input.getAttribute('aria-describedby')).to.equal('error-text');
    await expect(el).to.be.accessible();
  });

  it('uses native disabled', async () => {
    const el = await fixture<CdzRadio>(html`<cdz-radio label="Opción A" disabled></cdz-radio>`);
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.disabled).to.be.true;
    await expect(el).to.be.accessible();
  });

  it('fires a change event and updates checked when toggled', async () => {
    const el = await fixture<CdzRadio>(html`<cdz-radio label="Opción A"></cdz-radio>`);
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

  it('does NOT auto-uncheck a sibling cdz-radio sharing the same name — documented shadow-DOM limitation, not a bug to "fix" here', async () => {
    const a = await fixture<CdzRadio>(
      html`<cdz-radio label="Opción A" name="group" checked></cdz-radio>`
    );
    const b = await fixture<CdzRadio>(html`<cdz-radio label="Opción B" name="group"></cdz-radio>`);

    const inputB = b.shadowRoot!.querySelector('input')!;
    inputB.checked = true;
    inputB.dispatchEvent(new Event('change', { bubbles: true }));
    await b.updateComplete;

    // Each shadow root is its own DOM tree for native radio grouping —
    // checking B does not uncheck A, unlike two native <input type="radio">
    // in the same light-DOM document would. See radio.ts's class comment.
    expect(a.checked).to.be.true;
    expect(b.checked).to.be.true;
  });

  it('warns loudly (console.error) when label is missing, without throwing', async () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      await fixture<CdzRadio>(html`<cdz-radio></cdz-radio>`);
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
      await fixture<CdzRadio>(html`<cdz-radio label="Opción A"></cdz-radio>`);
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.equal(0);
  });
});
