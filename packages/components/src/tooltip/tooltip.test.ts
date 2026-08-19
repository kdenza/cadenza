import { html, fixture, expect, aTimeout } from '@open-wc/testing';
import './tooltip.js';
import '../button/button.js';
import type { CdzTooltip } from './tooltip.js';

/** Delays are read from tokens; tests override them to stay fast. */
function fast(el: CdzTooltip): void {
  el.style.setProperty('--cdz-tooltip-delay-open', '0ms');
  el.style.setProperty('--cdz-tooltip-delay-close', '10ms');
}

function bubble(el: CdzTooltip): HTMLElement {
  return el.querySelector('[data-cdz-tooltip-bubble]')!;
}

function isOpen(el: CdzTooltip): boolean {
  return bubble(el).matches(':popover-open');
}

async function makeTooltip(text = 'Se envía a tu correo') {
  const el = await fixture<CdzTooltip>(
    html`<cdz-tooltip text=${text}><button>Enviar</button></cdz-tooltip>`
  );
  fast(el);
  return el;
}

describe('cdz-tooltip', () => {
  it('puts the accessible description in the light DOM, where the id resolves', async () => {
    // The crux of this component: an id inside the shadow root would be
    // invisible to a trigger in the light DOM.
    const el = await makeTooltip();
    const trigger = el.querySelector('button')!;
    const id = trigger.getAttribute('aria-describedby')!;

    expect(id, 'the trigger should be described').to.be.a('string').and.not.be.empty;
    const described = document.getElementById(id);
    expect(described, 'the id must resolve from the document scope').to.exist;
    expect(described!.textContent).to.equal('Se envía a tu correo');
    expect(described!.getAttribute('role')).to.equal('tooltip');
    // It must be a light-DOM child of the component, not shadow content.
    expect(described!.parentElement).to.equal(el);
    expect(el.shadowRoot!.getElementById(id)).to.be.null;
  });

  it('hides the description by clipping, never by removing it from the a11y tree', async () => {
    const el = await makeTooltip();
    const described = document.getElementById(
      el.querySelector('button')!.getAttribute('aria-describedby')!
    )!;
    const styles = getComputedStyle(described);
    expect(styles.display).to.not.equal('none');
    expect(styles.visibility).to.not.equal('hidden');
  });

  it('keeps the visible bubble out of the accessibility tree', async () => {
    // It duplicates the description node; announcing both would repeat it.
    const el = await makeTooltip();
    expect(bubble(el).getAttribute('aria-hidden')).to.equal('true');
  });

  it('uses a manual popover so it cannot close an open listbox', async () => {
    // auto popovers dismiss one another — a tooltip appearing while a
    // cdz-select is open would close the select.
    const el = await makeTooltip();
    expect(bubble(el).getAttribute('type')).to.equal('manual');
    expect(bubble(el).getAttribute('popover')).to.equal('manual');
  });

  it('opens on focus with no delay', async () => {
    const el = await makeTooltip();
    expect(isOpen(el)).to.be.false;
    el.querySelector('button')!.dispatchEvent(new FocusEvent('focusin'));
    expect(isOpen(el)).to.be.true;
  });

  it('closes when focus leaves', async () => {
    const el = await makeTooltip();
    const trigger = el.querySelector('button')!;
    trigger.dispatchEvent(new FocusEvent('focusin'));
    expect(isOpen(el)).to.be.true;
    trigger.dispatchEvent(new FocusEvent('focusout'));
    expect(isOpen(el)).to.be.false;
  });

  it('opens on hover', async () => {
    const el = await makeTooltip();
    el.querySelector('button')!.dispatchEvent(new MouseEvent('mouseenter'));
    await aTimeout(20);
    expect(isOpen(el)).to.be.true;
  });

  it('is dismissible with Escape, per WCAG 1.4.13', async () => {
    const el = await makeTooltip();
    el.querySelector('button')!.dispatchEvent(new FocusEvent('focusin'));
    expect(isOpen(el)).to.be.true;

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(isOpen(el)).to.be.false;
  });

  it('is hoverable: moving the pointer onto the bubble keeps it open', async () => {
    // The condition that matters for screen magnification — reading the
    // tooltip can require putting the pointer on it.
    const el = await makeTooltip();
    const trigger = el.querySelector('button')!;

    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    await aTimeout(20);
    expect(isOpen(el)).to.be.true;

    // Pointer leaves the trigger heading for the bubble...
    trigger.dispatchEvent(new MouseEvent('mouseleave'));
    // ...and arrives before the scheduled close fires.
    bubble(el).dispatchEvent(new MouseEvent('mouseenter'));
    await aTimeout(40);

    expect(isOpen(el), 'should survive the trip from trigger to bubble').to.be.true;
  });

  it('closes once the pointer leaves the bubble too', async () => {
    const el = await makeTooltip();
    const trigger = el.querySelector('button')!;
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    await aTimeout(20);
    trigger.dispatchEvent(new MouseEvent('mouseleave'));
    bubble(el).dispatchEvent(new MouseEvent('mouseenter'));
    await aTimeout(20);
    expect(isOpen(el)).to.be.true;

    bubble(el).dispatchEvent(new MouseEvent('mouseleave'));
    await aTimeout(40);
    expect(isOpen(el)).to.be.false;
  });

  it('is persistent: nothing closes it on a timer while hovered', async () => {
    const el = await makeTooltip();
    const trigger = el.querySelector('button')!;
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    await aTimeout(20);
    await aTimeout(300);
    expect(isOpen(el), 'must not self-dismiss').to.be.true;
  });

  it('does not flash a tooltip for a pointer that only passes through', async () => {
    const el = await fixture<CdzTooltip>(
      html`<cdz-tooltip text="Ayuda"><button>X</button></cdz-tooltip>`
    );
    el.style.setProperty('--cdz-tooltip-delay-open', '400ms');
    const trigger = el.querySelector('button')!;
    trigger.dispatchEvent(new MouseEvent('mouseenter'));
    await aTimeout(30);
    trigger.dispatchEvent(new MouseEvent('mouseleave'));
    await aTimeout(60);
    expect(isOpen(el), 'the open delay should have swallowed it').to.be.false;
  });

  it('keeps the description in sync when text changes', async () => {
    const el = await makeTooltip();
    const id = el.querySelector('button')!.getAttribute('aria-describedby')!;
    el.text = 'Texto nuevo';
    await el.updateComplete;
    expect(document.getElementById(id)!.textContent).to.equal('Texto nuevo');
  });

  it('gives each instance its own description id', async () => {
    const a = await makeTooltip('Uno');
    const b = await makeTooltip('Dos');
    const idA = a.querySelector('button')!.getAttribute('aria-describedby');
    const idB = b.querySelector('button')!.getAttribute('aria-describedby');
    expect(idA).to.not.equal(idB);
    expect(document.getElementById(idA!)!.textContent).to.equal('Uno');
    expect(document.getElementById(idB!)!.textContent).to.equal('Dos');
  });

  it('is accessible closed and open', async () => {
    const el = await makeTooltip();
    await expect(el).to.be.accessible();

    el.querySelector('button')!.dispatchEvent(new FocusEvent('focusin'));
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it('works with a cdz-button trigger, not just a bare button', async () => {
    const el = await fixture<CdzTooltip>(
      html`<cdz-tooltip text="Ayuda"><cdz-button>Enviar</cdz-button></cdz-tooltip>`
    );
    fast(el);
    const trigger = el.querySelector('cdz-button')!;
    const id = trigger.getAttribute('aria-describedby');
    expect(id).to.be.a('string').and.not.be.empty;
    expect(document.getElementById(id!)).to.exist;
  });

  it('warns loudly when there is nothing to describe', async () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      await fixture<CdzTooltip>(html`<cdz-tooltip text="Sin disparador"></cdz-tooltip>`);
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.be.greaterThan(0);
    expect(String(calls[0][0])).to.include('disparador');
  });
});
