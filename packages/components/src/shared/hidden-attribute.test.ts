import { fixtureSync, expect } from '@open-wc/testing';
import '../index.js';

/**
 * Un test para todo el sistema, no uno por componente.
 *
 * Cualquier componente que declare `:host { display: ... }` desactiva el
 * atributo `hidden` sin querer: la regla `[hidden] { display: none }` del
 * navegador es de origen UA, y `:host` es de autor, así que gana la de
 * autor y el elemento se sigue viendo. La contrapartida obligatoria es
 * `:host([hidden]) { display: none }`.
 *
 * Se encontró en producción, no aquí: el enlace a la galería —que apunta a
 * un `localhost` y por eso lleva `hidden` fuera de desarrollo— aparecía a
 * la vista en el sitio desplegado. Los 18 componentes con `display` en su
 * `:host` tenían el mismo agujero.
 *
 * Este test recorre el registro real de custom elements en vez de una
 * lista escrita a mano, así que un componente nuevo queda cubierto por
 * existir, sin que nadie tenga que acordarse de añadirlo.
 */
const TAGS = [
  'cdz-avatar', 'cdz-badge', 'cdz-button', 'cdz-checkbox', 'cdz-divider',
  'cdz-file-input', 'cdz-icon', 'cdz-input', 'cdz-link', 'cdz-progress',
  'cdz-radio', 'cdz-range', 'cdz-select', 'cdz-spinner', 'cdz-switch',
  'cdz-text', 'cdz-textarea', 'cdz-tooltip'
];

describe('el atributo hidden', () => {
  it('cubre todos los componentes registrados salvo cdz-popover', () => {
    // cdz-popover queda fuera a propósito: su visibilidad la gobierna la
    // API de popover (:host(:popover-open)), no display en el :host.
    const registrados = TAGS.filter((t) => customElements.get(t));
    expect(registrados.length).to.equal(TAGS.length);
  });

  for (const tag of TAGS) {
    it(`oculta <${tag}> de verdad`, async () => {
      const el = fixtureSync<HTMLElement>(`<${tag} hidden></${tag}>`);
      await (el as HTMLElement & { updateComplete?: Promise<unknown> }).updateComplete;

      // No basta con que el atributo esté: hay que medir lo que gana la
      // cascada, que es justo lo que el bug demostró.
      expect(getComputedStyle(el).display, `${tag} ignora hidden`).to.equal('none');

      const rect = el.getBoundingClientRect();
      expect(rect.width + rect.height, `${tag} sigue ocupando espacio`).to.equal(0);
    });
  }
});
