import { html, fixture, expect } from '@open-wc/testing';
import './button.js';
import '../icon/icon.js';
import type { CdzButton } from './button.js';

describe('cdz-button', () => {
  it('renders slotted content', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button>Enviar</cdz-button>`);
    expect(el.textContent?.trim()).to.equal('Enviar');
  });

  it('defaults to type="button" so it never accidentally submits a form', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button>Enviar</cdz-button>`);
    const button = el.shadowRoot!.querySelector('button')!;
    expect(button.getAttribute('type')).to.equal('button');
  });

  it('is accessible in its default state', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button>Enviar</cdz-button>`);
    await expect(el).to.be.accessible();
  });

  it('is accessible in its disabled state', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button disabled>Enviar</cdz-button>`);
    await expect(el).to.be.accessible();
  });

  it('reflects disabled as aria-disabled without using the native disabled attribute', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button disabled>Enviar</cdz-button>`);
    const button = el.shadowRoot!.querySelector('button')!;
    expect(button.getAttribute('aria-disabled')).to.equal('true');
    expect(button.hasAttribute('disabled')).to.be.false;
  });

  it('stays focusable when disabled', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button disabled>Enviar</cdz-button>`);
    const button = el.shadowRoot!.querySelector('button')!;
    button.focus();
    expect(el.shadowRoot!.activeElement).to.equal(button);
  });

  it('blocks clicks while disabled', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button disabled>Enviar</cdz-button>`);
    const button = el.shadowRoot!.querySelector('button')!;
    let clicked = false;
    el.addEventListener('click', () => {
      clicked = true;
    });
    button.click();
    expect(clicked).to.be.false;
  });

  it('fires a click event when enabled', async () => {
    const el = await fixture<CdzButton>(html`<cdz-button>Enviar</cdz-button>`);
    const button = el.shadowRoot!.querySelector('button')!;
    let clicked = false;
    el.addEventListener('click', () => {
      clicked = true;
    });
    button.click();
    expect(clicked).to.be.true;
  });

  it('centres an icon against the label rather than sitting it on the baseline', async () => {
    const el = await fixture<CdzButton>(
      html`<cdz-button><cdz-icon name="menu" size="sm"></cdz-icon>Ir a un componente</cdz-button>`
    );
    const icon = el.querySelector('cdz-icon')!;
    const slot = el.shadowRoot!.querySelector('slot')!;
    const label = slot
      .assignedNodes({ flatten: true })
      .find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim().length > 0)!;

    // A Range, so this measures the glyph box and not a wrapper.
    const range = document.createRange();
    range.selectNodeContents(label);
    const text = range.getBoundingClientRect();
    const box = icon.getBoundingClientRect();

    const centreOf = (r: DOMRect) => (r.top + r.bottom) / 2;
    const offset = Math.abs(centreOf(box) - centreOf(text));

    // Before this was a flex container the icon sat on the text baseline,
    // which put its centre 3.2px above the label's. That is the failure
    // this test exists to catch, so the tolerance is set against it rather
    // than against zero.
    //
    // It was 0.5px, and a different Chromium build measured exactly 0.5 --
    // failing on `lessThan(0.5)` while the layout was perfectly correct.
    // Sub-pixel geometry varies with build and font rasterisation, so an
    // assertion with no slack at its own boundary is a measurement waiting
    // to flip: ADR-0019's table, from the direction where the tool says
    // "broken" and is wrong. 1.5px keeps a 2x margin to the real bug.
    expect(offset, `icon centre is ${offset.toFixed(1)}px off the label's`).to.be.lessThan(1.5);
  });

  it('keeps a label centred, the way a native button does', async () => {
    // Switching to flex drops the text-align a native button applies, so
    // justify-content has to put it back. A wide button makes the
    // difference visible at all.
    const el = await fixture<CdzButton>(
      html`<cdz-button style="width: 300px; display: block">Enviar</cdz-button>`
    );
    const button = el.shadowRoot!.querySelector('button')!;
    const slot = el.shadowRoot!.querySelector('slot')!;
    const label = slot
      .assignedNodes({ flatten: true })
      .find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim().length > 0)!;
    const range = document.createRange();
    range.selectNodeContents(label);
    const text = range.getBoundingClientRect();
    const box = button.getBoundingClientRect();

    const offset = Math.abs((text.left + text.right) / 2 - (box.left + box.right) / 2);
    expect(offset, `label is ${offset.toFixed(1)}px off centre`).to.be.lessThan(1);
  });

  it('puts a real gap between icon and label, since flex drops the whitespace', async () => {
    const el = await fixture<CdzButton>(
      html`<cdz-button><cdz-icon name="menu" size="sm"></cdz-icon>Ir</cdz-button>`
    );
    const icon = el.querySelector('cdz-icon')!.getBoundingClientRect();
    const slot = el.shadowRoot!.querySelector('slot')!;
    const label = slot
      .assignedNodes({ flatten: true })
      .find((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim().length > 0)!;
    const range = document.createRange();
    range.selectNodeContents(label);
    const text = range.getBoundingClientRect();

    // A flex container does not render the whitespace text node that used
    // to separate them, so without an explicit gap they would touch.
    expect(text.left - icon.right).to.be.greaterThan(3);
  });
  it('is loud about a bare `expanded`, which parses as "" and reaches nobody', async () => {
    // The natural HTML spelling. It parses as '', which is the
    // "not a disclosure" sentinel, so aria-expanded was dropped -- the same
    // outcome as the cdz-page-nav bug this property exists to fix, by a
    // different route and just as quiet.
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      await fixture(html`<cdz-button expanded>Más</cdz-button>`);
    } finally {
      console.error = originalError;
    }
    expect(calls.some((c) => String(c[0]).includes('"expanded" must be'))).to.be.true;
  });

  it('never passes an invalid expanded through to aria-expanded', async () => {
    // aria-expanded="yes" is invalid ARIA: AT treats it as absent and axe
    // flags it. Dropping it is better than forwarding it, and saying so is
    // better than either.
    const originalError = console.error;
    console.error = () => {};
    let el: HTMLElement;
    try {
      el = await fixture(html`<cdz-button expanded="yes">Más</cdz-button>`);
    } finally {
      console.error = originalError;
    }
    expect(el!.shadowRoot!.querySelector('button')!.hasAttribute('aria-expanded')).to.be.false;
  });

  it('does not put a disclosure-shaped attribute on every button', async () => {
    // `reflect: true` on a property defaulting to '' made Lit write it back
    // on first update, so every button in the system serialised as
    // <cdz-button expanded="">.
    const el = await fixture(html`<cdz-button>Guardar</cdz-button>`);
    expect(el.hasAttribute('expanded')).to.be.false;
  });
});
