import { html, fixture, expect } from '@open-wc/testing';
import './divider.js';
import type { CdzDivider } from './divider.js';

function rule(el: CdzDivider): HTMLHRElement {
  return el.shadowRoot!.querySelector('hr')!;
}

describe('cdz-divider', () => {
  it('renders a real <hr>', async () => {
    const el = await fixture<CdzDivider>(html`<cdz-divider></cdz-divider>`);
    expect(rule(el)).to.exist;
  });

  it('is decorative by default — a rule between list rows is not a thematic break', async () => {
    const el = await fixture<CdzDivider>(html`<cdz-divider></cdz-divider>`);
    expect(el.semantic).to.be.false;
    expect(rule(el).getAttribute('role')).to.equal('none');
  });

  it('becomes a real separator when asked', async () => {
    const el = await fixture<CdzDivider>(html`<cdz-divider semantic></cdz-divider>`);
    // No explicit role: <hr> already maps to separator, and writing it by
    // hand would duplicate what the platform provides.
    expect(rule(el).hasAttribute('role')).to.be.false;
  });

  it('switches between decorative and semantic at runtime', async () => {
    const el = await fixture<CdzDivider>(html`<cdz-divider></cdz-divider>`);
    expect(rule(el).getAttribute('role')).to.equal('none');

    el.semantic = true;
    await el.updateComplete;
    expect(rule(el).hasAttribute('role')).to.be.false;

    el.semantic = false;
    await el.updateComplete;
    expect(rule(el).getAttribute('role')).to.equal('none');
  });

  it('defaults to horizontal and reflects the orientation for styling', async () => {
    const el = await fixture<CdzDivider>(html`<cdz-divider></cdz-divider>`);
    expect(el.orientation).to.equal('horizontal');
    expect(el.getAttribute('orientation')).to.equal('horizontal');
  });

  it('exposes aria-orientation only when vertical AND semantic', async () => {
    // Horizontal is the separator default, so stating it adds nothing;
    // and on a decorative rule an orientation is meaningless.
    const decorativeVertical = await fixture<CdzDivider>(
      html`<cdz-divider orientation="vertical"></cdz-divider>`
    );
    expect(rule(decorativeVertical).hasAttribute('aria-orientation')).to.be.false;

    const semanticHorizontal = await fixture<CdzDivider>(
      html`<cdz-divider semantic></cdz-divider>`
    );
    expect(rule(semanticHorizontal).hasAttribute('aria-orientation')).to.be.false;

    const semanticVertical = await fixture<CdzDivider>(
      html`<cdz-divider orientation="vertical" semantic></cdz-divider>`
    );
    expect(rule(semanticVertical).getAttribute('aria-orientation')).to.equal('vertical');
  });

  it('resets the browser <hr> defaults that would otherwise leak through', async () => {
    const el = await fixture<CdzDivider>(html`<cdz-divider></cdz-divider>`);
    const styles = getComputedStyle(rule(el));
    // A bare <hr> ships 8px block margins and an `inset` border.
    expect(styles.marginBlockStart).to.equal('0px');
    expect(styles.marginBlockEnd).to.equal('0px');
    expect(styles.borderTopStyle).to.equal('none');
  });

  it('draws a horizontal line one token-thickness tall', async () => {
    const el = await fixture<CdzDivider>(html`<cdz-divider></cdz-divider>`);
    const styles = getComputedStyle(rule(el));
    expect(styles.height).to.equal('1px');
    expect(styles.backgroundColor).to.not.equal('rgba(0, 0, 0, 0)');
  });

  it('draws a vertical line one token-thickness wide', async () => {
    const el = await fixture<CdzDivider>(
      html`<cdz-divider orientation="vertical"></cdz-divider>`
    );
    const styles = getComputedStyle(rule(el));
    expect(styles.width).to.equal('1px');
  });

  it('carries no outer margin — spacing belongs to the layout', async () => {
    const el = await fixture<CdzDivider>(html`<cdz-divider></cdz-divider>`);
    const styles = getComputedStyle(el);
    expect(styles.marginTop).to.equal('0px');
    expect(styles.marginBottom).to.equal('0px');
  });

  it('is accessible decorative and semantic, in both orientations', async () => {
    for (const markup of [
      html`<cdz-divider></cdz-divider>`,
      html`<cdz-divider semantic></cdz-divider>`,
      html`<cdz-divider orientation="vertical"></cdz-divider>`,
      html`<cdz-divider orientation="vertical" semantic></cdz-divider>`
    ]) {
      const el = await fixture<CdzDivider>(markup);
      await expect(el).to.be.accessible();
    }
  });
});
