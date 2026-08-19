/**
 * Shared by every form atom that requires a visible `label`
 * (`cdz-input`, `cdz-checkbox`, `cdz-radio`, `cdz-select`): warns loudly —
 * but doesn't throw — when `label` is empty. A labelless form control
 * isn't just impolite, it's a hard accessibility failure (axe-core flags
 * it `critical`: "Form elements must have labels" — first surfaced while
 * testing `cdz-input` in @kdenza/gallery, see ADR-0003). `console.error`
 * rather than an exception: a misused prop shouldn't be able to take down
 * the rest of the page, but it should be impossible to miss in devtools.
 *
 * Call from each component's `willUpdate()` so it re-checks on every
 * update, not just the first — catches a valid label being cleared later,
 * not just an initially-missing one.
 *
 * Extracted after the third form atom (`cdz-radio`) repeated this
 * verbatim — see ADR-0007's note to reconsider at the next one.
 */
export function warnIfLabelMissing(tagName: string, label: string): void {
  if (label.trim().length === 0) {
    console.error(
      `[${tagName}] "label" es obligatorio: un campo sin label no es accesible. ` +
        `Pásalo como propiedad o atributo, ej. <${tagName} label="...">.`
    );
  }
}
