import { LitElement, html, nothing } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { avatarStyles } from './avatar.styles.js';
import '../icon/icon.js';

export type CdzAvatarSize = 'sm' | 'md' | 'lg';
export type CdzAvatarFallback = 'initials' | 'icon';

/**
 * First *grapheme cluster* of a word, not its first code unit.
 *
 * The difference is not academic here. A decomposed "ñ" is two code
 * points (n + U+0303), so `word[0]` and even `Array.from(word)[0]` return
 * a bare "n" and the tilde is dropped — measured in the browser before
 * choosing this. Devanagari is worse: "क्षमा" starts with a three-code-point
 * cluster that renders as one letter, and slicing it produces a different
 * letter, not a truncated one.
 *
 * `Intl.Segmenter` is the only thing that gets both right. It has been in
 * every current browser for years, but the fallback is kept because the
 * failure mode without it is a wrong initial rather than a crash, and
 * that is exactly the kind of thing that should degrade quietly.
 */
function firstGrapheme(word: string): string {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
    return segmenter.segment(word)[Symbol.iterator]().next().value?.segment ?? '';
  }
  return Array.from(word)[0] ?? '';
}

/**
 * Initials for a name: first letter of the first word, plus first letter
 * of the last. "Ana de la Cruz" gives "AC" — particles are skipped for
 * free by only ever looking at the ends, which is also why no list of
 * particles has to be maintained per language.
 *
 * Exported so its edge cases can be tested directly, without a component
 * around them.
 */
export function initialsFrom(name: string): string {
  const words = name.trim().split(/\s+/).filter((word) => word.length > 0);
  if (words.length === 0) return '';

  const first = firstGrapheme(words[0]);
  const last = words.length > 1 ? firstGrapheme(words[words.length - 1]) : '';

  // Normalised to NFC so the same name always produces the same string,
  // whichever encoding it arrived in. "ñ" reaches a web app both as one
  // code point and as n + U+0303 depending on where it was typed — most
  // famously from macOS filenames — and the two render identically while
  // comparing as different. Caught by a test asserting 'ÑG' equalled 'ÑG'.
  return (first + last).toLocaleUpperCase().normalize('NFC');
}

/**
 * `<cdz-avatar>` — a person, as a small round picture.
 *
 * Three ways to render, in order: the photo at `src`; failing that, the
 * initials taken from `name`; failing that, a generic person icon. Which
 * of the last two is used is `fallback`'s job, and both are real options
 * rather than one being a degraded version of the other — initials say
 * *which* person when the photo is missing, the icon says *a* person when
 * showing initials would be wrong (a placeholder row, an account with no
 * name yet, a deliberately anonymous entry).
 *
 * **Meaningful by default — the opposite of `cdz-icon` and
 * `cdz-divider`.** Those two default to decorative, and ADR-0021 stated
 * the shared rule as "the default is the quieter option". This component
 * breaks it on purpose, and the reason is worth being precise about,
 * because the useful part is the refinement, not the exception:
 *
 * - `cdz-icon` cannot default to meaningful, because it has no correct
 *   string to use. It would have to invent one from the icon's `name`,
 *   and "alert-triangle" read aloud is worse than silence.
 * - This component already requires `name` — the initials are derived
 *   from it — so the loud option is not a guess. It is the person's
 *   actual name, sitting right there.
 *
 * The failure modes are asymmetric in the direction that settles it. An
 * avatar wrongly announced repeats a name that was already on screen:
 * verbose, no violation. An avatar wrongly silent, used as the only
 * identifier in an avatar stack or an account button, is unidentifiable —
 * a WCAG 1.1.1 failure. So: **default to quiet when the loud option would
 * have to be guessed; default to loud when the correct string is already
 * in hand.**
 *
 * `decorative` opts out, for the common case where the name is printed
 * next to the avatar anyway ("Kyrah commented 2 hours ago") and
 * announcing it twice is just noise.
 *
 * The initials and the icon are never announced either way. "KM" read
 * aloud is not a name, and under `role="img"` the children are
 * presentational regardless — the `aria-label` is what carries meaning.
 *
 * **`name` is required, but only when it is actually used.** A decorative
 * avatar falling back to the icon genuinely has nothing to say, so
 * warning there would be a false positive — and warnings that cry wolf
 * get filtered out, which costs more than the check is worth. This is why
 * it doesn't use the shared `warnIfLabelMissing`: that helper's message
 * is about form fields, and the condition here isn't unconditional.
 *
 * There is no colour derived from the name. Hashing a name to a hue is a
 * common trick and it is a contrast trap: every generated colour has to
 * clear 4.5:1 against the initials in both light and dark, which a hash
 * cannot promise. One verified pair from the status palette (ADR-0017)
 * instead. See ADR-0022.
 */
export class CdzAvatar extends LitElement {
  static styles = avatarStyles;

  static properties = {
    name: { type: String },
    src: { type: String },
    fallback: { type: String, reflect: true },
    size: { type: String, reflect: true },
    decorative: { type: Boolean, reflect: true },
    _imageFailed: { state: true }
  };

  // `declare` — see button.ts for why these can't be plain class fields.
  declare name: string;
  declare src: string;
  declare fallback: CdzAvatarFallback;
  declare size: CdzAvatarSize;
  declare decorative: boolean;
  declare private _imageFailed: boolean;

  constructor() {
    super();
    this.name = '';
    this.src = '';
    this.fallback = 'initials';
    this.size = 'md';
    this.decorative = false;
    this._imageFailed = false;
  }

  protected willUpdate(changed: Map<string, unknown>): void {
    // A new src deserves its own chance to load — without this, one
    // broken photo would poison every later one on the same element.
    if (changed.has('src')) this._imageFailed = false;

    const usesName = !this.decorative || this.fallback === 'initials';
    if (usesName && this.name.trim().length === 0) {
      console.error(
        '[cdz-avatar] "name" es obligatorio: es de donde salen las iniciales y ' +
          'el nombre accesible del avatar. Si el avatar es puramente decorativo ' +
          'y no necesita nombre, usa <cdz-avatar decorative fallback="icon">.'
      );
    }
  }

  private _handleError = (): void => {
    this._imageFailed = true;
  };

  render() {
    // An empty src is "no photo", not "broken photo" — worth separating,
    // because assigning src="" to an <img> fires `error` rather than
    // doing nothing (measured, see ADR-0022). Never rendering the element
    // in that case sidesteps it entirely.
    const hasSrc = this.src.trim().length > 0;
    const showImage = hasSrc && !this._imageFailed;

    const initials = initialsFrom(this.name);
    // Falls through to the icon when initials were asked for but the name
    // yields none, so the worst case is still a person-shaped mark rather
    // than an empty circle.
    const showInitials = this.fallback === 'initials' && initials.length > 0;

    const label = this.name.trim();
    const isMeaningful = !this.decorative && label.length > 0;

    return html`
      <span
        class="avatar"
        role=${ifDefined(isMeaningful ? 'img' : undefined)}
        aria-label=${ifDefined(isMeaningful ? label : undefined)}
        aria-hidden=${ifDefined(isMeaningful ? undefined : 'true')}
      >
        ${showInitials
          ? html`<span class="initials">${initials}</span>`
          : html`<span class="icon"><cdz-icon name="user" size="inherit"></cdz-icon></span>`}
        ${showImage
          ? html`<img src=${this.src} alt="" @error=${this._handleError} />`
          : nothing}
      </span>
    `;
  }
}

customElements.define('cdz-avatar', CdzAvatar);

declare global {
  interface HTMLElementTagNameMap {
    'cdz-avatar': CdzAvatar;
  }
}
