import { html, fixture, expect, aTimeout, waitUntil } from '@open-wc/testing';
import { sendMouse } from '@web/test-runner-commands';
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

    // Real Escape dismissal is native browser behavior and cannot be
    // driven by a synthetic key event (see popover.test.ts). What *can*
    // be driven is the state change Escape actually causes: hiding the
    // popover from outside the component, which fires the same native
    // toggle event this component listens for. Dispatching a bare
    // ToggleEvent instead would leave the popover genuinely open and
    // assert against a state no user can reach.
    el.shadowRoot!.querySelector('cdz-popover')!.hidePopover();
    await aTimeout(0);
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
  it('keeps listening for light-dismiss after being re-parented', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    const popover = el.shadowRoot!.querySelector('cdz-popover') as HTMLElement;

    // Setup runs once (firstUpdated) and teardown on every unmount, so a
    // move used to leave this element deaf to every change it does not
    // itself initiate.
    const parent = el.parentElement!;
    el.remove();
    parent.appendChild(el);
    await el.updateComplete;

    trigger(el).click();
    await el.updateComplete;
    expect(trigger(el).getAttribute('aria-expanded')).to.equal('true');

    // Closed from outside the component, the way light-dismiss and Escape
    // do it: this reaches _open only through the toggle listener.
    popover.hidePopover();
    await aTimeout(0);
    await el.updateComplete;
    expect(trigger(el).getAttribute('aria-expanded')).to.equal('false');
  });

  it('does not report itself expanded over a listbox the move already closed', async () => {
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    trigger(el).click();
    await el.updateComplete;
    expect(trigger(el).getAttribute('aria-expanded')).to.equal('true');

    // Removing a showing popover from the document hides it, and says so
    // to nobody.
    const parent = el.parentElement!;
    el.remove();
    parent.appendChild(el);
    await el.updateComplete;

    expect(trigger(el).getAttribute('aria-expanded')).to.equal('false');
  });
  /** A real pointer, because a synthetic click never triggers light dismiss. */
  async function realClick(el: Element): Promise<void> {
    const r = el.getBoundingClientRect();
    await sendMouse({
      type: 'click',
      position: [Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)]
    });
  }

  it('closes on a second REAL click of the trigger', async () => {
    // Light dismiss runs between pointerdown and click, so by the time the
    // click handler saw it the panel was already closed and toggle()
    // reopened it -- the trigger could never close the select. Only a
    // trusted pointer reproduces it: .click() dispatches no pointer
    // events, so every existing test passed over the bug.
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    const button = trigger(el);

    // waitUntil, not a fixed tick: light dismiss and the popover's `toggle`
    // event are the browser's to schedule, and under a full concurrent run
    // one turn of the event loop is not reliably enough. Waiting on the
    // condition rather than on a duration is ADR-0028's rule -- a test must
    // not depend on timing the environment controls.
    await realClick(button);
    await waitUntil(() => button.getAttribute('aria-expanded') === 'true', 'first click opens');

    await realClick(button);
    await waitUntil(
      () => button.getAttribute('aria-expanded') === 'false',
      'second click has to close'
    );
  });

  it('does not fire change when the option picked is the one already selected', async () => {
    // Native <select> is silent here. This fired every time, so anything
    // counting changes saw edits the user never made.
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS} value="ar"></cdz-select>`
    );
    let fired = 0;
    el.addEventListener('change', () => {
      fired++;
    });

    trigger(el).click();
    await el.updateComplete;
    options(el)[0].click();
    await el.updateComplete;

    expect(fired, 're-picking the current option is not a change').to.equal(0);
    expect(el.value).to.equal('ar');
    expect(trigger(el).getAttribute('aria-expanded'), 'but it still closes').to.equal('false');
  });
  it('an abandoned press does not swallow the next pointer-less activation', async () => {
    // Pressed on the trigger, released somewhere else: light dismiss closes
    // the panel and no click ever arrives, so the pointerdown snapshot is
    // left behind. It used to answer for whatever activation came next -- a
    // screen reader in browse mode, voice control, switch access, a
    // consumer's .click() -- none of which ran light dismiss at all. The
    // symptom was "the first press does nothing", which is the hardest kind
    // to report.
    //
    // Deliberately NOT driven with a trusted multi-step gesture. That
    // version worked alone and timed out under the full concurrent run,
    // because a move/down/move/up sequence needs the page to hold input
    // focus -- an environment dependency, which is the exact shape ADR-0028
    // exists to keep out of this suite. Trusted input is used where trust is
    // what is being tested (light dismiss ordering, in the test above); the
    // defect here is in this component's own bookkeeping, and reproducing it
    // needs no real pointer:
    //
    //   1. open it, 2. leave a stale snapshot behind, 3. close it the way
    //   light dismiss would, 4. activate with no pointer.
    const el = await fixture<CdzSelect>(
      html`<cdz-select label="País" .options=${SAMPLE_OPTIONS}></cdz-select>`
    );
    const button = trigger(el);
    const popover = el.shadowRoot!.querySelector('cdz-popover') as HTMLElement;

    button.click();
    await el.updateComplete;
    expect(button.getAttribute('aria-expanded')).to.equal('true');

    // The snapshot handler only reads :popover-open, so a plain event is
    // enough to leave the same stale value a real abandoned press leaves.
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    popover.hidePopover();
    await aTimeout(0);
    await el.updateComplete;
    expect(button.getAttribute('aria-expanded'), 'closed, snapshot now stale').to.equal(
      'false'
    );

    button.click();
    await el.updateComplete;
    expect(
      button.getAttribute('aria-expanded'),
      'an activation with no pointer behind it must still open the listbox'
    ).to.equal('true');
  });
});
