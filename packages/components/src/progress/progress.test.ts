import { html, fixture, expect } from '@open-wc/testing';
import './progress.js';
import type { CdzProgress } from './progress.js';

describe('cdz-progress', () => {
  it('associates the label with the progress element via for/id', async () => {
    const el = await fixture<CdzProgress>(
      html`<cdz-progress label="Subiendo archivo" value="45"></cdz-progress>`
    );
    const label = el.shadowRoot!.querySelector('label')!;
    const bar = el.shadowRoot!.querySelector('progress')!;
    expect(label.getAttribute('for')).to.equal(bar.id);
    // Labelable is a property of the native element, not something added
    // here — it's part of what using <progress> buys.
    expect(bar.labels!.length).to.equal(1);
  });

  it('lets the platform derive the value semantics from value/max', async () => {
    const el = await fixture<CdzProgress>(
      html`<cdz-progress label="Subiendo" value="45" max="100"></cdz-progress>`
    );
    const bar = el.shadowRoot!.querySelector('progress')!;
    expect(bar.value).to.equal(45);
    expect(bar.max).to.equal(100);
    expect(bar.position).to.equal(0.45);
    // Deliberately NOT hand-written: if these ever appear as attributes,
    // someone has started duplicating what the platform already maps.
    expect(bar.hasAttribute('aria-valuenow')).to.be.false;
    expect(bar.hasAttribute('role')).to.be.false;
  });

  it('defaults to max 100 and value 0, like a bare <progress>', async () => {
    const el = await fixture<CdzProgress>(html`<cdz-progress label="Subiendo"></cdz-progress>`);
    const bar = el.shadowRoot!.querySelector('progress')!;
    expect(bar.max).to.equal(100);
    expect(bar.value).to.equal(0);
  });

  it('is never indeterminate — that case belongs to cdz-spinner', async () => {
    const el = await fixture<CdzProgress>(html`<cdz-progress label="Subiendo"></cdz-progress>`);
    const bar = el.shadowRoot!.querySelector('progress')!;
    // position is -1 only for an indeterminate <progress>.
    expect(bar.position).to.not.equal(-1);
    expect(bar.hasAttribute('value')).to.be.true;
  });

  it('respects a custom max', async () => {
    const el = await fixture<CdzProgress>(
      html`<cdz-progress label="Archivos" value="3" max="10"></cdz-progress>`
    );
    const bar = el.shadowRoot!.querySelector('progress')!;
    expect(bar.max).to.equal(10);
    expect(bar.position).to.equal(0.3);
  });

  it('is accessible at several points along the range', async () => {
    const el = await fixture<CdzProgress>(
      html`<cdz-progress label="Subiendo archivo" value="0"></cdz-progress>`
    );
    await expect(el).to.be.accessible();

    el.value = 45;
    await el.updateComplete;
    await expect(el).to.be.accessible();

    el.value = 100;
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it('exposes valueText via aria-valuetext when the raw number is not useful', async () => {
    const el = await fixture<CdzProgress>(
      html`<cdz-progress
        label="Subiendo archivo"
        value="45"
        value-text="45 de 100 MB"
      ></cdz-progress>`
    );
    expect(el.shadowRoot!.querySelector('progress')!.getAttribute('aria-valuetext')).to.equal(
      '45 de 100 MB'
    );
    await expect(el).to.be.accessible();
  });

  it('omits aria-valuetext entirely when not provided', async () => {
    const el = await fixture<CdzProgress>(
      html`<cdz-progress label="Subiendo" value="45"></cdz-progress>`
    );
    // An empty aria-valuetext would override the platform's own value
    // announcement with nothing, which is worse than being absent.
    expect(el.shadowRoot!.querySelector('progress')!.hasAttribute('aria-valuetext')).to.be.false;
  });

  it('hides the visible readout from assistive tech to avoid announcing it twice', async () => {
    const el = await fixture<CdzProgress>(
      html`<cdz-progress label="Subiendo" value="45" show-value></cdz-progress>`
    );
    const readout = el.shadowRoot!.querySelector('.value')!;
    expect(readout.getAttribute('aria-hidden')).to.equal('true');
    expect(readout.textContent!.trim()).to.equal('45%');
  });

  it('shows valueText rather than a percentage when both are available', async () => {
    const el = await fixture<CdzProgress>(
      html`<cdz-progress
        label="Subiendo"
        value="45"
        value-text="45 de 100 MB"
        show-value
      ></cdz-progress>`
    );
    expect(el.shadowRoot!.querySelector('.value')!.textContent!.trim()).to.equal('45 de 100 MB');
  });

  it('omits the readout unless asked for it', async () => {
    const el = await fixture<CdzProgress>(
      html`<cdz-progress label="Subiendo" value="45"></cdz-progress>`
    );
    expect(el.shadowRoot!.querySelector('.value')).to.be.null;
  });

  it('computes the displayed percentage against max, not against 100', async () => {
    const el = await fixture<CdzProgress>(
      html`<cdz-progress label="Archivos" value="3" max="10" show-value></cdz-progress>`
    );
    expect(el.shadowRoot!.querySelector('.value')!.textContent!.trim()).to.equal('30%');
  });

  it('does not divide by zero when max is zero', async () => {
    const el = await fixture<CdzProgress>(
      html`<cdz-progress label="Vacío" value="0" max="0" show-value></cdz-progress>`
    );
    expect(el.shadowRoot!.querySelector('.value')!.textContent!.trim()).to.equal('0%');
  });

  it('warns loudly (console.error) when label is missing, without throwing', async () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      await fixture<CdzProgress>(html`<cdz-progress value="45"></cdz-progress>`);
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
      await fixture<CdzProgress>(html`<cdz-progress label="Subiendo"></cdz-progress>`);
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.equal(0);
  });
});
