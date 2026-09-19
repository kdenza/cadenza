/**
 * Forces a native input's `checked` back into agreement with the
 * component property that owns it.
 *
 * lit-html skips a binding whose value has not changed since it last
 * committed, which is normally exactly what you want. It is wrong here,
 * because a **user** can change `input.checked` without going through the
 * binding at all.
 *
 * The sequence that breaks — measured on all four checkable components:
 *
 * 1. The component renders with `.checked=${false}`. lit-html commits
 *    `false`.
 * 2. Someone clicks. The browser sets `input.checked = true` itself and
 *    fires `change`.
 * 3. The handler copies that onto the property and dispatches its own
 *    `change`.
 * 4. A listener reverts it — `el.checked = false`. That is an ordinary
 *    thing for a consumer to do: failed validation, a confirmation step,
 *    an optimistic update the server rejected.
 * 5. Lit renders. The binding's value is `false`, which is what lit-html
 *    last committed, so it does nothing.
 *
 * The property now reads `false` while the control on screen is checked
 * and `FormData` still carries it. The component is wrong in two
 * directions at once, and neither is visible from the property.
 *
 * So the native state is reasserted in `updated()`, where the dirty check
 * does not reach it. This is the same mechanism `cdz-checkbox` already
 * used for `indeterminate` — there because the property cannot be bound
 * declaratively at all, here because the binding cannot be relied on to
 * fire.
 */
export function syncCheckedState(
  input: HTMLInputElement | null | undefined,
  checked: boolean
): void {
  if (input && input.checked !== checked) input.checked = checked;
}
