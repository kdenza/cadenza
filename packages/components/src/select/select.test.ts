import { html, fixture, expect } from '@open-wc/testing';
import './select.js';
import type { CdzSelect } from './select.js';

const SAMPLE_OPTIONS = [
  { value: 'ar', label: 'Argentina' },
  { value: 'br', label: 'Brasil' },
  { value: 'cl', label: 'Chile', disabled: true }
];

function trigger(el: CdzSelect): HTMLButtonElement {
  return el.shadowRoot!.querySelector('#trigger')!;
}

function options(el: CdzSelect): HTMLLIElement[] {
  return Array.from(el.shadowRoot!.querySelectorAll('li[role="option"]'));
}

describe('cdz-select', () => {
  it('associates the label with the trigger via for/id', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    const label = el.shadowRoot!.querySelector('label')!;
    expect(label.getAttribute('for')).to.equal(trigger(el).id);
  });

  it('renders the trigger as a combobox with the listbox initially collapsed', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    const button = trigger(el);
    expect(button.getAttribute('role')).to.equal('combobox');
    expect(button.getAttribute('aria-haspopup')).to.equal('listbox');
    expect(button.getAttribute('aria-expanded')).to.equal('false');
  });

  it('renders one option per entry in "options", respecting per-option disabled', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    const items = options(el);
    expect(items.length).to.equal(3);
    expect(items[2].getAttribute('aria-disabled')).to.equal('true');
  });

  it('is accessible collapsed, expanded, with a placeholder, and in the error state', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    await expect(el).to.be.accessible();

    trigger(el).click();
    await el.updateComplete;
    await expect(el).to.be.accessible();

    el.placeholder = 'Elige un país';
    await el.updateComplete;
    await expect(el).to.be.accessible();

    el.errorMessage = 'Este campo es obligatorio';
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it('shows the placeholder on the trigger when there is no value', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select
        label="País"
        placeholder="Elige un país"
        .options=${SAMPLE_OPTIONS}
      ></cdz-select>`
    );
    const button = trigger(el);
    expect(button.hasAttribute('data-placeholder')).to.be.true;
    expect(button.querySelector('.value')!.textContent).to.equal('Elige un país');
  });

  it('exposes helper text via aria-describedby', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select
        label="País"
        helper-text="Usamos esto para calcular impuestos"
        .options=${SAMPLE_OPTIONS}
      ></cdz-select>`
    );
    expect(trigger(el).getAttribute('aria-describedby')).to.equal('helper-text');
  });

  it('switches to the error state: aria-invalid and aria-describedby', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select
        label="País"
        error-message="Elige un país"
        .options=${SAMPLE_OPTIONS}
      ></cdz-select>`
    );
    expect(trigger(el).getAttribute('aria-invalid')).to.equal('true');
    expect(trigger(el).getAttribute('aria-describedby')).to.equal('error-text');
  });

  it('uses native disabled on the trigger', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" disabled .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    expect(trigger(el).disabled).to.be.true;
    await expect(el).to.be.accessible();
  });

  it('opens the listbox on click and sets aria-expanded/aria-controls', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    trigger(el).click();
    await el.updateComplete;
    expect(trigger(el).getAttribute('aria-expanded')).to.equal('true');
    expect(trigger(el).getAttribute('aria-controls')).to.equal('listbox');
  });

  it('commits a value and fires change on option click, closing the listbox', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    trigger(el).click();
    await el.updateComplete;

    let changeFired = false;
    el.addEventListener('change', () => {
      changeFired = true;
    });

    options(el)[1].click();
    await el.updateComplete;

    expect(changeFired).to.be.true;
    expect(el.value).to.equal('br');
    expect(trigger(el).getAttribute('aria-expanded')).to.equal('false');
  });

  it('never moves real focus off the trigger while the listbox is open', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    trigger(el).focus();
    trigger(el).click();
    await el.updateComplete;
    expect(el.shadowRoot!.activeElement).to.equal(trigger(el));
  });

  it('ArrowDown opens the listbox and moves aria-activedescendant without committing', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    const button = trigger(el);
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    await el.updateComplete;
    expect(button.getAttribute('aria-expanded')).to.equal('true');
    expect(button.getAttribute('aria-activedescendant')).to.equal('option-0');
    expect(el.value).to.equal('');

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    await el.updateComplete;
    // Index 1 (Brasil) is enabled; index 2 (Chile) is disabled and must be
    // reachable neither by this nor a further ArrowDown (no wraparound).
    expect(button.getAttribute('aria-activedescendant')).to.equal('option-1');
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    await el.updateComplete;
    expect(button.getAttribute('aria-activedescendant')).to.equal('option-1');
  });

  it('Enter commits the active option and closes the listbox', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    const button = trigger(el);

    let changeFired = false;
    el.addEventListener('change', () => {
      changeFired = true;
    });

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    await el.updateComplete;
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    await el.updateComplete;

    expect(changeFired).to.be.true;
    expect(el.value).to.equal('ar');
    expect(button.getAttribute('aria-expanded')).to.equal('false');
  });

  it('Home/End jump to the first/last enabled option', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    const button = trigger(el);
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    await el.updateComplete;

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true, composed: true }));
    await el.updateComplete;
    // Chile (index 2) is disabled, so End lands on Brasil (index 1).
    expect(button.getAttribute('aria-activedescendant')).to.equal('option-1');

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true, composed: true }));
    await el.updateComplete;
    expect(button.getAttribute('aria-activedescendant')).to.equal('option-0');
  });

  it('type-ahead commits immediately while closed, only highlights while open', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    const button = trigger(el);

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.value).to.equal('br');
    expect(button.getAttribute('aria-expanded')).to.equal('false');

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    await el.updateComplete;
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, composed: true }));
    await el.updateComplete;
    expect(button.getAttribute('aria-activedescendant')).to.equal('option-0');
    expect(el.value).to.equal('br'); // unchanged -- highlight only, no commit
  });

  it('Escape closes without changing the value (native light-dismiss)', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    const button = trigger(el);
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, composed: true }));
    await el.updateComplete;
    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true, composed: true }));
    await el.updateComplete;
    expect(el.value).to.equal('');

    // Real Escape dismissal is native browser behavior (untestable via
    // synthetic events -- see popover.test.ts), so this exercises the
    // same code path cdz-popover's own toggle listener would trigger.
    el.shadowRoot!.querySelector('cdz-popover')!.dispatchEvent(
      new ToggleEvent('toggle', { newState: 'closed' })
    );
    await el.updateComplete;
    expect(el.value).to.equal('');
    expect(button.getAttribute('aria-expanded')).to.equal('false');
  });

  it('warns loudly (console.error) when label is missing, without throwing', async () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      await fixture<CdzSelect>(html`<cdz-select .options=${SAMPLE_OPTIONS}></cdz-select>`);
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
      await fixture<CdzSelect>(
        html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
      );
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.equal(0);
  });
});
