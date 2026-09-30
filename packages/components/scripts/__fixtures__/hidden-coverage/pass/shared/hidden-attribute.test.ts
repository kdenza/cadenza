import { fixtureSync, expect } from '@open-wc/testing';
import '../index.js';

/**
 * One test for the whole system, not one per component.
 *
 * Any component declaring `:host { display: ... }` silently disables the
 * `hidden` attribute: the browser's `[hidden] { display: none }` is a UA
 * rule and `:host` is an author rule, so the author rule wins and the
 * element stays visible. The mandatory counterpart is
 * `:host([hidden]) { display: none }` — see ADR-0025.
 *
 * It was found in production, not here: the gallery link — which points at
 * a localhost and therefore carries `hidden` outside development — was
 * visible on the deployed site. All 18 components with a `display` on
 * their `:host` had the same hole.
 *
 * The list below is written by hand, because the custom element registry
 * has no enumeration API to walk. That is a real gap: a new component
 * would be silently uncovered while this file looked complete. So the list
 * is not trusted on its own — `scripts/check-hidden-coverage.mjs` runs as
 * `pretest` and fails if any `customElements.define('cdz-…')` in the
 * source is missing from it.
 *
 * (An earlier version of this comment claimed the test walked the registry
 * itself. It never did. When the Node check was finally written it found
 * two uncovered components on its first run: cdz-radio-group, being added
 * at the time, and cdz-page-nav — which had been uncovered for five
 * commits, including the ones where it reintroduced this very bug.)
 */
const TAGS = [
  'cdz-avatar', 'cdz-avatar-stack', 'cdz-badge', 'cdz-button', 'cdz-checkbox', 'cdz-divider',
  'cdz-file-input', 'cdz-icon', 'cdz-input', 'cdz-link', 'cdz-popover', 'cdz-progress',
  'cdz-page-nav', 'cdz-radio', 'cdz-radio-group', 'cdz-range', 'cdz-select',
  'cdz-spinner', 'cdz-switch', 'cdz-text', 'cdz-textarea', 'cdz-tooltip'
];

describe('the hidden attribute', () => {
  it('lists only tags that are actually registered', () => {
    // The other direction — every registered tag appearing in this list —
    // cannot be checked here and is enforced in Node instead.
    const registered = TAGS.filter((tag) => customElements.get(tag));
    expect(registered).to.have.lengthOf(TAGS.length);
  });

  for (const tag of TAGS) {
    it(`genuinely hides <${tag}>`, async () => {
      const el = fixtureSync<HTMLElement>(`<${tag} hidden></${tag}>`);
      await (el as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete;

      // The attribute being present is not enough: what has to be measured
      // is what wins the cascade, which is exactly what the bug showed.
      expect(getComputedStyle(el).display, `${tag} ignores hidden`).to.equal('none');

      const rect = el.getBoundingClientRect();
      expect(rect.width + rect.height, `${tag} still takes up space`).to.equal(0);
    });
  }

  /**
   * cdz-popover needs this one on top of the loop above, and the reason is
   * the interesting part: the loop cannot fail for it.
   *
   * A closed popover computes to `display: none` from the UA stylesheet
   * whether or not it honours `hidden`, so the default-state assertion
   * passes either way. It passed while the component was broken. Listing a
   * component in TAGS buys coverage of its default state only, and for
   * every other component that is the whole story because their display
   * does not depend on state.
   *
   * The browser gets this right on its own: a plain div[popover][hidden]
   * stays `display: none` through showPopover(). cdz-popover was
   * overriding that with :host(:popover-open) { display: flex } and
   * rendering at 62px while carrying `hidden`.
   *
   * Note the ordering constraint this asserts from the outside:
   * :host([hidden]) and :host(:popover-open) have identical specificity,
   * so :host([hidden]) has to come last in popover.styles.ts. Written in
   * the conventional place at the top of the file, it does nothing and
   * this test goes red.
   */
  it('genuinely hides <cdz-popover> while it is OPEN, not just closed', async () => {
    const el = fixtureSync<HTMLElement & { show(): void; updateComplete: Promise<unknown> }>(
      '<cdz-popover hidden>contenido</cdz-popover>'
    );
    await el.updateComplete;
    el.show();
    await el.updateComplete;

    expect(el.matches(':popover-open'), 'the popover should really be open').to.be.true;
    expect(getComputedStyle(el).display, 'cdz-popover ignores hidden once open').to.equal(
      'none'
    );
    const rect = el.getBoundingClientRect();
    expect(rect.width + rect.height, 'cdz-popover still takes up space').to.equal(0);
  });

  it('still shows <cdz-popover> when it is open and not hidden', async () => {
    // The guard against fixing the above by breaking the primitive.
    const el = fixtureSync<HTMLElement & { show(): void; updateComplete: Promise<unknown> }>(
      '<cdz-popover>contenido</cdz-popover>'
    );
    await el.updateComplete;
    el.show();
    await el.updateComplete;

    expect(getComputedStyle(el).display).to.equal('flex');
  });
});
