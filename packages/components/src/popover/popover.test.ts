import { html, fixture, expect } from '@open-wc/testing';
import './popover.js';
import type { CdzPopover } from './popover.js';

describe('cdz-popover', () => {
  it('defaults to type "auto" and sets the native popover attribute accordingly', async () => {
    const el = await fixture<CdzPopover>(html`<cdz-popover></cdz-popover>`);
    expect(el.popover).to.equal('auto');
  });

  it('respects an explicit type="manual"', async () => {
    const el = await fixture<CdzPopover>(html`<cdz-popover type="manual"></cdz-popover>`);
    expect(el.popover).to.equal('manual');
  });

  it('opens and closes via show()/hide(), reflected in :popover-open and .open', async () => {
    const el = await fixture<CdzPopover>(html`<cdz-popover></cdz-popover>`);
    expect(el.open).to.be.false;

    el.show();
    expect(el.matches(':popover-open')).to.be.true;
    expect(el.open).to.be.true;

    el.hide();
    expect(el.matches(':popover-open')).to.be.false;
    expect(el.open).to.be.false;
  });

  it('toggle() flips between shown and hidden', async () => {
    const el = await fixture<CdzPopover>(html`<cdz-popover></cdz-popover>`);
    el.toggle();
    expect(el.matches(':popover-open')).to.be.true;
    el.toggle();
    expect(el.matches(':popover-open')).to.be.false;
  });

  it('is a no-op to show() when already open, and to hide() when already closed', async () => {
    const el = await fixture<CdzPopover>(html`<cdz-popover></cdz-popover>`);
    expect(() => el.hide()).to.not.throw();
    el.show();
    expect(() => el.show()).to.not.throw();
  });

  it('keeps .open in sync when closed by native means, not just hide()', async () => {
    const el = await fixture<CdzPopover>(html`<cdz-popover></cdz-popover>`);
    el.show();
    expect(el.open).to.be.true;

    // Simulates what the browser fires on light-dismiss/Escape/another
    // exclusive popover taking over -- none of which go through hide().
    el.dispatchEvent(new ToggleEvent('toggle', { newState: 'closed' }));
    expect(el.open).to.be.false;
  });

  it('wires anchor-name/position-anchor between the anchor element and itself', async () => {
    const el = await fixture<CdzPopover>(html`<cdz-popover></cdz-popover>`);
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);

    el.anchor = trigger;

    const anchorName = trigger.style.getPropertyValue('anchor-name');
    expect(anchorName).to.not.equal('');
    expect(el.style.getPropertyValue('position-anchor')).to.equal(anchorName);

    trigger.remove();
  });

  it('clears the previous anchor element anchor-name when reassigned', async () => {
    const el = await fixture<CdzPopover>(html`<cdz-popover></cdz-popover>`);
    const triggerA = document.createElement('button');
    const triggerB = document.createElement('button');
    document.body.append(triggerA, triggerB);

    el.anchor = triggerA;
    el.anchor = triggerB;

    expect(triggerA.style.getPropertyValue('anchor-name')).to.equal('');
    expect(triggerB.style.getPropertyValue('anchor-name')).to.not.equal('');

    triggerA.remove();
    triggerB.remove();
  });

  it('falls back to a computed fixed position when anchor positioning is unsupported', async () => {
    const originalSupports = CSS.supports;
    // `_supportsAnchorPositioning` is read once at construction, so the
    // browser has to "not support" anchor positioning at that exact
    // moment -- patch CSS.supports only around createElement.
    (CSS as { supports: typeof CSS.supports }).supports = () => false;
    const el = document.createElement('cdz-popover') as CdzPopover;
    CSS.supports = originalSupports;

    document.body.appendChild(el);
    await el.updateComplete;

    const trigger = document.createElement('button');
    trigger.style.position = 'fixed';
    trigger.style.top = '200px';
    trigger.style.left = '100px';
    trigger.style.height = '30px';
    document.body.appendChild(trigger);
    // Force layout so getBoundingClientRect below reflects the styles above.
    void trigger.getBoundingClientRect();

    el.anchor = trigger;
    el.show();

    expect(el.style.top).to.equal('230px');
    expect(el.style.left).to.equal('100px');

    el.remove();
    trigger.remove();
  });
});
