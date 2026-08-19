import { html, fixture, expect } from '@open-wc/testing';
import './range.js';
import type { CdzRange } from './range.js';

describe('cdz-range', () => {
  it('associates the label with the input via for/id', async () => {
    const el = await fixture<CdzRange>(html`<cdz-range label="Volumen"></cdz-range>`);
    const label = el.shadowRoot!.querySelector('label')!;
    const input = el.shadowRoot!.querySelector('input')!;
    expect(label.getAttribute('for')).to.equal(input.id);
  });

  it('associates the live value with the input via output/for', async () => {
    const el = await fixture<CdzRange>(html`<cdz-range label="Volumen"></cdz-range>`);
    const output = el.shadowRoot!.querySelector('output')!;
    const input = el.shadowRoot!.querySelector('input')!;
    expect(output.getAttribute('for')).to.equal(input.id);
    expect(output.textContent).to.equal('50');
  });

  it('defaults to native <input type="range"> defaults: min 0, max 100, step 1, value 50', async () => {
    const el = await fixture<CdzRange>(html`<cdz-range label="Volumen"></cdz-range>`);
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.min).to.equal('0');
    expect(input.max).to.equal('100');
    expect(input.step).to.equal('1');
    expect(input.value).to.equal('50');
  });

  it('respects custom min/max/step/value', async () => {
    const el = await fixture<CdzRange>(
      html`<cdz-range label="Temperatura" min="10" max="30" step="5" value="20"></cdz-range>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.min).to.equal('10');
    expect(input.max).to.equal('30');
    expect(input.step).to.equal('5');
    expect(input.value).to.equal('20');
    expect(el.shadowRoot!.querySelector('output')!.textContent).to.equal('20');
  });

  it('does not clamp value against the native default max (100) when max is set higher', async () => {
    // Regression test: min/max/step must bind before .value in the
    // template (see render()'s comment) -- on first render the native
    // element's own default max is 100 until the max attribute binding
    // runs, so a value like 1000 would silently clamp to 100 if .value
    // were applied first.
    const el = await fixture<CdzRange>(
      html`<cdz-range label="Presupuesto" min="0" max="1000" step="50" value="1000"></cdz-range>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.value).to.equal('1000');
  });

  it('sets --cdz-range-fill-percent based on value/min/max', async () => {
    const el = await fixture<CdzRange>(
      html`<cdz-range label="Volumen" min="0" max="200" value="50"></cdz-range>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.style.getPropertyValue('--cdz-range-fill-percent')).to.equal('25%');

    el.value = 150;
    await el.updateComplete;
    expect(input.style.getPropertyValue('--cdz-range-fill-percent')).to.equal('75%');
  });

  it('is accessible at the default, an arbitrary, and the disabled state', async () => {
    const el = await fixture<CdzRange>(html`<cdz-range label="Volumen"></cdz-range>`);
    await expect(el).to.be.accessible();

    el.value = 80;
    await el.updateComplete;
    await expect(el).to.be.accessible();

    el.disabled = true;
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it('exposes helper text via aria-describedby', async () => {
    const el = await fixture<CdzRange>(
      html`<cdz-range label="Volumen" helper-text="0 es silencio, 100 es el máximo"></cdz-range>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.getAttribute('aria-describedby')).to.equal('helper-text');
  });

  it('switches to the error state: aria-invalid and aria-describedby', async () => {
    const el = await fixture<CdzRange>(
      html`<cdz-range label="Volumen" error-message="Fuera del rango permitido"></cdz-range>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.getAttribute('aria-invalid')).to.equal('true');
    expect(input.getAttribute('aria-describedby')).to.equal('error-text');
    await expect(el).to.be.accessible();
  });

  it('uses native disabled', async () => {
    const el = await fixture<CdzRange>(html`<cdz-range label="Volumen" disabled></cdz-range>`);
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.disabled).to.be.true;
  });

  it('fires input/change events with the current numeric value', async () => {
    const el = await fixture<CdzRange>(html`<cdz-range label="Volumen"></cdz-range>`);
    const input = el.shadowRoot!.querySelector('input')!;

    let lastInputValue: number | null = null;
    el.addEventListener('input', () => {
      lastInputValue = el.value;
    });

    input.value = '75';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    expect(lastInputValue).to.equal(75);
    expect(el.value).to.equal(75);
  });

  it('warns loudly (console.error) when label is missing, without throwing', async () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      await fixture<CdzRange>(html`<cdz-range></cdz-range>`);
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
      await fixture<CdzRange>(html`<cdz-range label="Volumen"></cdz-range>`);
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.equal(0);
  });
});
