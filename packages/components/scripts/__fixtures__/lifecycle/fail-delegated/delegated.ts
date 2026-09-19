import { LitElement, html } from 'lit';

/**
 * The one fixture here that is NOT a historical source.
 *
 * This shape never existed in `src/` — it was planted during review of the
 * branch that introduced `check-lifecycle-symmetry.mjs`, to show that
 * moving the release one function call away made all three rules go blind.
 * The guard printed a tick and exited 0 on it.
 *
 * It is kept because the refactor that produces it is ordinary: the next
 * time a `disconnectedCallback` gets long, someone extracts a `_teardown()`.
 * `cdz-tooltip` already delegates part of its teardown to `_clearTimers()`,
 * so the shape is one commit away from a file that exists.
 *
 * Acquires in firstUpdated, releases on every unmount, never re-establishes
 * — so it must trip rule 1 (no reconnect path) and rule 2 (an unpaired
 * listener), both through a callee rather than in the hook's own body.
 */
export class CdzDelegatedTeardown extends LitElement {
  private _onScroll = (): void => {};

  protected firstUpdated(): void {
    window.addEventListener('scroll', this._onScroll);
  }

  disconnectedCallback(): void {
    this._teardown();
    super.disconnectedCallback();
  }

  private _teardown(): void {
    window.removeEventListener('scroll', this._onScroll);
  }

  render() {
    return html`<slot></slot>`;
  }
}

customElements.define('cdz-delegated-teardown', CdzDelegatedTeardown);
