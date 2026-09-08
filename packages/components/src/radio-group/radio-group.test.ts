import { html, fixture, expect } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import './radio-group.js';
import '../radio/radio.js';
import type { CdzRadioGroup } from './radio-group.js';
import { CdzRadio } from '../radio/radio.js';

const OPTIONS = [
  { value: 'free', label: 'Gratis' },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Equipo' }
];

const group = () =>
  fixture<CdzRadioGroup>(
    html`<cdz-radio-group label="Plan" .options=${OPTIONS}></cdz-radio-group>`
  );

const inputsOf = (el: CdzRadioGroup) =>
  Array.from(el.shadowRoot!.querySelectorAll<HTMLInputElement>('input[type="radio"]'));

describe('cdz-radio-group', () => {
  it('names the group with a real legend inside a fieldset', async () => {
    const el = await group();
    const fieldset = el.shadowRoot!.querySelector('fieldset');
    const legend = fieldset?.querySelector('legend');

    // fieldset + legend, not role="radiogroup" on a div: these are native
    // radios, so the grouping the browser already implements is the one
    // that carries. See ADR-0029.
    expect(fieldset).to.exist;
    expect(legend?.textContent?.trim()).to.equal('Plan');
    expect(el.shadowRoot!.querySelector('[role="radiogroup"]')).to.be.null;
  });

  it('renders one native radio per option, all sharing one name in one root', async () => {
    const el = await group();
    const inputs = inputsOf(el);

    expect(inputs).to.have.lengthOf(3);

    // The structural fact the whole component exists for: every input is
    // in the SAME root with the SAME name, which is what makes the browser
    // treat them as one group. Two <cdz-radio> atoms cannot achieve this,
    // because each renders its input into its own shadow root.
    const roots = new Set(inputs.map((i) => i.getRootNode()));
    const names = new Set(inputs.map((i) => i.name));
    expect(roots.size, 'all inputs share one root').to.equal(1);
    expect(names.size, 'all inputs share one name').to.equal(1);
    expect([...names][0], 'the name is never empty').to.not.equal('');
  });

  it('generates a name when none is given, because unnamed radios do not group', async () => {
    const el = await group();
    expect(inputsOf(el)[0].name).to.match(/^cdz-radio-group-/);
  });

  it('uses the supplied name when there is one', async () => {
    const el = await fixture<CdzRadioGroup>(
      html`<cdz-radio-group label="Plan" name="plan" .options=${OPTIONS}></cdz-radio-group>`
    );
    expect(inputsOf(el).every((i) => i.name === 'plan')).to.be.true;
  });

  it('is genuinely mutually exclusive — the thing two cdz-radio atoms are not', async () => {
    const el = await group();
    const inputs = inputsOf(el);

    inputs[0].click();
    await el.updateComplete;
    expect(inputs[0].checked).to.be.true;

    inputs[2].click();
    await el.updateComplete;

    // The browser unchecked the first one. This is the exact assertion
    // that FAILS for two <cdz-radio> sharing a name — radio.test.ts locks
    // in that failure deliberately. Same expectation, opposite outcome,
    // and the difference is the shadow root boundary.
    expect(inputs[0].checked, 'the browser unchecked the first option').to.be.false;
    expect(inputs[2].checked).to.be.true;
    expect(el.value).to.equal('team');
  });

  it('proves the contrast: two cdz-radio atoms sharing a name do NOT exclude each other', async () => {
    // Two standalone atoms, same name, as ADR-0007 documented.
    const a = document.createElement('cdz-radio') as CdzRadio;
    const b = document.createElement('cdz-radio') as CdzRadio;
    a.label = 'A';
    b.label = 'B';
    a.name = b.name = 'shared';
    document.body.append(a, b);
    await a.updateComplete;
    await b.updateComplete;

    const inputA = a.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    const inputB = b.shadowRoot!.querySelector<HTMLInputElement>('input')!;
    inputA.click();
    inputB.click();

    // Both checked at once: not a group. This is why the group renders its
    // own radios instead of composing these.
    expect(inputA.checked, 'the atom stays checked — no mutual exclusion').to.be.true;
    expect(inputB.checked).to.be.true;

    a.remove();
    b.remove();
  });

  it('moves selection with the arrow keys, using real key events', async () => {
    const el = await group();
    const inputs = inputsOf(el);

    inputs[0].focus();
    inputs[0].click();
    await el.updateComplete;

    // sendKeys dispatches a trusted event through CDP. A synthetic
    // KeyboardEvent would NOT drive native radio behaviour, so asserting
    // on one would be a measurement of nothing — see ADR-0019's table.
    await sendKeys({ press: 'ArrowDown' });
    await el.updateComplete;

    expect(inputs[1].checked, 'ArrowDown selected the next option').to.be.true;
    expect(inputs[0].checked).to.be.false;
    expect(el.value).to.equal('pro');

    await sendKeys({ press: 'ArrowUp' });
    await el.updateComplete;
    expect(inputs[0].checked, 'ArrowUp went back').to.be.true;
    expect(el.value).to.equal('free');
  });

  it('emits change and reflects value when an option is picked', async () => {
    const el = await group();
    let fired = 0;
    el.addEventListener('change', () => (fired += 1));

    inputsOf(el)[1].click();
    await el.updateComplete;

    expect(fired).to.equal(1);
    expect(el.value).to.equal('pro');
    expect(el.getAttribute('value')).to.equal('pro');
  });

  it('checks the option matching value, and none when value matches nothing', async () => {
    const el = await fixture<CdzRadioGroup>(
      html`<cdz-radio-group label="Plan" value="pro" .options=${OPTIONS}></cdz-radio-group>`
    );
    expect(inputsOf(el).map((i) => i.checked)).to.deep.equal([false, true, false]);

    el.value = 'nonexistent';
    await el.updateComplete;
    expect(inputsOf(el).some((i) => i.checked), 'no option is checked').to.be.false;
  });

  it('disables every option when the group is disabled', async () => {
    const el = await fixture<CdzRadioGroup>(
      html`<cdz-radio-group label="Plan" disabled .options=${OPTIONS}></cdz-radio-group>`
    );
    expect(inputsOf(el).every((i) => i.disabled)).to.be.true;
  });

  it('disables a single option without disabling the group', async () => {
    const el = await fixture<CdzRadioGroup>(
      html`<cdz-radio-group
        label="Plan"
        .options=${[{ value: 'a', label: 'A' }, { value: 'b', label: 'B', disabled: true }]}
      ></cdz-radio-group>`
    );
    expect(inputsOf(el).map((i) => i.disabled)).to.deep.equal([false, true]);
  });

  it('puts required on the group, where ADR-0007 said it belonged', async () => {
    const el = await fixture<CdzRadioGroup>(
      html`<cdz-radio-group label="Plan" required .options=${OPTIONS}></cdz-radio-group>`
    );
    expect(inputsOf(el).every((i) => i.required)).to.be.true;

    // The atom deliberately has no required property at all — ADR-0007
    // left it out because it is meaningless for one radio in isolation.
    expect(CdzRadio.observedAttributes).to.not.contain('required');
  });

  it('wires helper text and error text to every option', async () => {
    const helper = await fixture<CdzRadioGroup>(
      html`<cdz-radio-group label="Plan" helper-text="Puedes cambiarlo después" .options=${OPTIONS}></cdz-radio-group>`
    );
    expect(inputsOf(helper).every((i) => i.getAttribute('aria-describedby') === 'helper-text')).to.be
      .true;
    expect(helper.shadowRoot!.querySelector('#helper-text')?.textContent).to.contain(
      'Puedes cambiarlo'
    );

    const error = await fixture<CdzRadioGroup>(
      html`<cdz-radio-group label="Plan" error-message="Elige un plan" .options=${OPTIONS}></cdz-radio-group>`
    );
    expect(inputsOf(error).every((i) => i.getAttribute('aria-describedby') === 'error-text')).to.be
      .true;
    expect(inputsOf(error).every((i) => i.getAttribute('aria-invalid') === 'true')).to.be.true;
  });

  it('warns when the group has no label, since the legend is what names it', async () => {
    // console.error, not console.warn — see shared/required-label.ts, which
    // chose error precisely so a labelless field is impossible to miss.
    const errors: string[] = [];
    const original = console.error;
    console.error = (msg: string) => errors.push(msg);

    await fixture<CdzRadioGroup>(html`<cdz-radio-group .options=${OPTIONS}></cdz-radio-group>`);

    console.error = original;
    expect(errors.some((e) => e.includes('cdz-radio-group'))).to.be.true;
  });

  it('renders nothing but the legend when there are no options', async () => {
    const el = await fixture<CdzRadioGroup>(
      html`<cdz-radio-group label="Plan"></cdz-radio-group>`
    );
    expect(inputsOf(el)).to.have.lengthOf(0);
    expect(el.shadowRoot!.querySelector('legend')?.textContent?.trim()).to.equal('Plan');
  });

  it('is accessible in its default, selected, error and disabled states', async () => {
    await expect(await group()).to.be.accessible();

    await expect(
      await fixture<CdzRadioGroup>(
        html`<cdz-radio-group label="Plan" value="pro" .options=${OPTIONS}></cdz-radio-group>`
      )
    ).to.be.accessible();

    await expect(
      await fixture<CdzRadioGroup>(
        html`<cdz-radio-group label="Plan" error-message="Elige un plan" required .options=${OPTIONS}></cdz-radio-group>`
      )
    ).to.be.accessible();

    await expect(
      await fixture<CdzRadioGroup>(
        html`<cdz-radio-group label="Plan" disabled .options=${OPTIONS}></cdz-radio-group>`
      )
    ).to.be.accessible();
  });

  it('is horizontal only when asked', async () => {
    const vertical = await group();
    const horizontal = await fixture<CdzRadioGroup>(
      html`<cdz-radio-group label="Plan" orientation="horizontal" .options=${OPTIONS}></cdz-radio-group>`
    );

    const dirOf = (el: CdzRadioGroup) =>
      getComputedStyle(el.shadowRoot!.querySelector('.options')!).flexDirection;

    expect(dirOf(vertical)).to.equal('column');
    expect(dirOf(horizontal)).to.equal('row');
  });
});
