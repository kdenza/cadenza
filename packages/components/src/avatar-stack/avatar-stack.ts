import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { avatarStackStyles } from './avatar-stack.styles.js';
import { warnIfLabelMissing } from '../shared/required-label.js';
import '../avatar/avatar.js';
import type { CdzAvatarFallback, CdzAvatarSize } from '../avatar/avatar.js';

export interface CdzAvatarStackPerson {
  name: string;
  src?: string;
  fallback?: CdzAvatarFallback;
}

/**
 * `<cdz-avatar-stack>` — several overlapping avatars with a "+N" overflow.
 *
 * The third molecule, and the one that keeps ADR-0029 from being read as
 * the wrong rule. That ADR found that `<cdz-radio-group>` must NOT compose
 * `<cdz-radio>`, because native radio grouping does not cross shadow roots
 * — nesting the atom would have destroyed the very guarantee the atom was
 * chosen for.
 *
 * The lesson there was never "molecules should not compose atoms". It was:
 * check whether the platform is the thing providing the guarantee. Here it
 * is not. An avatar's correctness is its own accessible name, and a name
 * survives being nested anywhere. So this molecule composes the atom
 * freely — it renders real `<cdz-avatar>` elements — and that is correct
 * for exactly the reason the radio group's composition would have been
 * wrong.
 *
 * ARIA pattern: a real `<ul>` of real `<li>`, named with `aria-label`. A
 * stack of people IS a list, and a list gives a screen reader the count
 * and per-item navigation for free. The avatars are rendered rather than
 * slotted so the `<li>` wrappers are genuine elements: `<ul>` may only
 * directly contain `<li>`, and a bare `<slot>` inside a `<ul>` would put
 * generic wrappers between the list and its items.
 *
 * The overflow chip is not a separate atom. It is a count, not a person,
 * and giving it `<cdz-avatar>`'s semantics would announce a number as
 * somebody's image.
 *
 * People beyond `max` are not rendered at all, rather than hidden with
 * CSS. A sighted user cannot read them either, so dropping them keeps the
 * accessible experience at parity instead of exposing names the visual
 * design has already decided not to show.
 */
export class CdzAvatarStack extends LitElement {
  static styles = avatarStackStyles;

  static properties = {
    label: { type: String },
    people: { type: Array },
    max: { type: Number },
    size: { type: String, reflect: true }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare label: string;
  declare people: CdzAvatarStackPerson[];
  declare max: number;
  declare size: CdzAvatarSize;

  constructor() {
    super();
    this.label = '';
    this.people = [];
    this.max = 0;
    this.size = 'md';
  }

  // See ../shared/required-label.ts. Here the label names the list: without
  // it a screen reader announces "list, 4 items" with no idea of whose.
  protected willUpdate(): void {
    warnIfLabelMissing('cdz-avatar-stack', this.label);
  }

  render() {
    // max <= 0 means "no limit", which is also the default.
    const limit = this.max > 0 ? this.max : this.people.length;
    const visible = this.people.slice(0, limit);
    const overflow = this.people.length - visible.length;

    // Later avatars sit on top, which is the opposite of what looks
    // conventional and was chosen by measuring rather than by taste.
    //
    // With earlier ones on top, each avatar after the first loses its LEFT
    // edge to its neighbour — and since initials are this system's default
    // fallback (ADR-0022), that eats the first letter of every name but
    // one: "AL", then "R" of BR, "D" of CD. Stacking the other way costs
    // the trailing letter instead, so every avatar keeps the letter a
    // reader starts on.

    return html`
      <ul aria-label=${ifDefined(this.label || undefined)}>
        ${visible.map(
          (person, index) => html`
            <li style="z-index: ${index}">
              <cdz-avatar
                name=${person.name}
                src=${ifDefined(person.src || undefined)}
                fallback=${ifDefined(person.fallback)}
                size=${this.size}
              ></cdz-avatar>
            </li>
          `
        )}
        ${overflow > 0
          ? html`<li style="z-index: ${visible.length}"><span class="overflow">+${overflow}</span></li>`
          : nothing}
      </ul>
    `;
  }
}

customElements.define('cdz-avatar-stack', CdzAvatarStack);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-avatar-stack': CdzAvatarStack;
  }
}
