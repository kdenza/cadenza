import { html, fixture, expect } from '@open-wc/testing';
import './file-input.js';
import type { CdzFileInput } from './file-input.js';

/** Builds a real FileList — the only way to populate a file input. */
function selectFiles(input: HTMLInputElement, ...files: File[]): void {
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

const CV = () => new File(['contenido'], 'cv.pdf', { type: 'application/pdf' });
const CARTA = () => new File(['contenido'], 'carta.pdf', { type: 'application/pdf' });

describe('cdz-file-input', () => {
  it('associates the label with the input via for/id', async () => {
    const el = await fixture<CdzFileInput>(html`<cdz-file-input label="Adjuntar CV"></cdz-file-input>`);
    const label = el.shadowRoot!.querySelector('label')!;
    const input = el.shadowRoot!.querySelector('input')!;
    expect(label.getAttribute('for')).to.equal(input.id);
  });

  it('keeps the visually hidden input focusable (never display:none)', async () => {
    // Regression guard: clipping keeps the control in the tab order, while
    // display:none / visibility:hidden would silently remove the only
    // keyboard-reachable part of this component.
    const el = await fixture<CdzFileInput>(html`<cdz-file-input label="Adjuntar CV"></cdz-file-input>`);
    const input = el.shadowRoot!.querySelector('input')!;
    const styles = getComputedStyle(input);
    expect(styles.display).to.not.equal('none');
    expect(styles.visibility).to.not.equal('hidden');

    input.focus();
    expect(el.shadowRoot!.activeElement).to.equal(input);
  });

  it('is accessible empty, with a file selected, and in error', async () => {
    const el = await fixture<CdzFileInput>(html`<cdz-file-input label="Adjuntar CV"></cdz-file-input>`);
    await expect(el).to.be.accessible();

    selectFiles(el.shadowRoot!.querySelector('input')!, CV());
    await el.updateComplete;
    await expect(el).to.be.accessible();

    el.errorMessage = 'El archivo es obligatorio';
    await el.updateComplete;
    await expect(el).to.be.accessible();
  });

  it('is accessible when disabled (color-contrast scoped out — see below)', async () => {
    // The disabled treatment here is the project-wide one from ADR-0002:
    // form.text.disabled on form.background.disabled, which is 3.03:1 in
    // light mode and deliberately exempt under WCAG 1.4.3 ("inactive user
    // interface component"). Every other atom uses the exact same pair and
    // passes axe unflagged, because their disabled text sits inside a
    // natively-disabled control and axe skips those. Here the visible text
    // is decorative <span>s that axe cannot associate with the disabled
    // input, so it reports the (exempt) ratio as a violation. Scoping the
    // rule for this state only keeps the check meaningful for everything
    // else rather than weakening it globally. See ADR-0014.
    const el = await fixture<CdzFileInput>(
      html`<cdz-file-input label="Adjuntar CV" disabled></cdz-file-input>`
    );
    await expect(el).to.be.accessible({ ignoredRules: ['color-contrast'] });
  });

  it('shows the placeholder until a file is chosen', async () => {
    const el = await fixture<CdzFileInput>(html`<cdz-file-input label="Adjuntar CV"></cdz-file-input>`);
    const filename = el.shadowRoot!.querySelector('.filename')!;
    expect(filename.classList.contains('is-placeholder')).to.be.true;
    expect(filename.textContent!.trim()).to.equal('Sin archivos seleccionados');
  });

  it('shows the filename once a file is chosen, and fires change', async () => {
    const el = await fixture<CdzFileInput>(html`<cdz-file-input label="Adjuntar CV"></cdz-file-input>`);
    const input = el.shadowRoot!.querySelector('input')!;

    let changeFired = false;
    el.addEventListener('change', () => {
      changeFired = true;
    });

    selectFiles(input, CV());
    await el.updateComplete;

    const filename = el.shadowRoot!.querySelector('.filename')!;
    expect(changeFired).to.be.true;
    expect(filename.textContent!.trim()).to.equal('cv.pdf');
    expect(filename.classList.contains('is-placeholder')).to.be.false;
  });

  it('summarises the count when several files are chosen', async () => {
    const el = await fixture<CdzFileInput>(
      html`<cdz-file-input label="Adjuntar CV" multiple></cdz-file-input>`
    );
    selectFiles(el.shadowRoot!.querySelector('input')!, CV(), CARTA());
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.filename')!.textContent!.trim()).to.equal(
      '2 archivos seleccionados'
    );
  });

  it('exposes the chosen files read-only via the files getter', async () => {
    const el = await fixture<CdzFileInput>(
      html`<cdz-file-input label="Adjuntar CV" multiple></cdz-file-input>`
    );
    expect(el.files).to.deep.equal([]);

    selectFiles(el.shadowRoot!.querySelector('input')!, CV(), CARTA());
    await el.updateComplete;

    expect(el.files.map((file) => file.name)).to.deep.equal(['cv.pdf', 'carta.pdf']);
  });

  it('clear() empties the selection — the one mutation the platform allows', async () => {
    const el = await fixture<CdzFileInput>(html`<cdz-file-input label="Adjuntar CV"></cdz-file-input>`);
    selectFiles(el.shadowRoot!.querySelector('input')!, CV());
    await el.updateComplete;
    expect(el.files).to.have.lengthOf(1);

    el.clear();
    await el.updateComplete;

    expect(el.files).to.have.lengthOf(0);
    expect(el.shadowRoot!.querySelector('.filename')!.textContent!.trim()).to.equal(
      'Sin archivos seleccionados'
    );
  });

  it('refuses a programmatically set filename (browser security boundary)', async () => {
    // Documents *why* this component has no settable `value`: the platform
    // itself rejects it, so exposing one would be a lie.
    const el = await fixture<CdzFileInput>(html`<cdz-file-input label="Adjuntar CV"></cdz-file-input>`);
    const input = el.shadowRoot!.querySelector('input')!;
    expect(() => {
      input.value = 'C:\\fakepath\\cv.pdf';
    }).to.throw();
  });

  it('passes accept and multiple through to the native input', async () => {
    const el = await fixture<CdzFileInput>(
      html`<cdz-file-input label="Adjuntar CV" accept=".pdf,.docx" multiple></cdz-file-input>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.accept).to.equal('.pdf,.docx');
    expect(input.multiple).to.be.true;
  });

  it('exposes helper text via aria-describedby', async () => {
    const el = await fixture<CdzFileInput>(
      html`<cdz-file-input label="Adjuntar CV" helper-text="PDF de hasta 5 MB"></cdz-file-input>`
    );
    expect(el.shadowRoot!.querySelector('input')!.getAttribute('aria-describedby')).to.equal(
      'helper-text'
    );
  });

  it('switches to the error state: aria-invalid and aria-describedby', async () => {
    const el = await fixture<CdzFileInput>(
      html`<cdz-file-input label="Adjuntar CV" error-message="Formato no admitido"></cdz-file-input>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.getAttribute('aria-invalid')).to.equal('true');
    expect(input.getAttribute('aria-describedby')).to.equal('error-text');
  });

  it('uses native disabled and does not open the picker when disabled', async () => {
    const el = await fixture<CdzFileInput>(
      html`<cdz-file-input label="Adjuntar CV" disabled></cdz-file-input>`
    );
    const input = el.shadowRoot!.querySelector('input')!;
    expect(input.disabled).to.be.true;

    let pickerOpened = false;
    input.addEventListener('click', () => {
      pickerOpened = true;
    });
    (el.shadowRoot!.querySelector('.control') as HTMLElement).click();
    expect(pickerOpened).to.be.false;
  });

  it('warns loudly (console.error) when label is missing, without throwing', async () => {
    const originalError = console.error;
    const calls: unknown[][] = [];
    console.error = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      await fixture<CdzFileInput>(html`<cdz-file-input></cdz-file-input>`);
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
      await fixture<CdzFileInput>(html`<cdz-file-input label="Adjuntar CV"></cdz-file-input>`);
    } finally {
      console.error = originalError;
    }
    expect(calls.length).to.equal(0);
  });
});
