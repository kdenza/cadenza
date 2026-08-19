# ADR-0019: `<cdz-progress>` — nativo cuando lo único que se gana es semántica

**Status:** Accepted
**Date:** 2026-08-02
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Tercer componente de "Feedback", y el complemento determinado de
`<cdz-spinner>` (ADR-0018). A diferencia de todos los átomos anteriores,
aquí el principio de "nativo primero" del proyecto merecía revisarse en
lugar de aplicarse por inercia.

## Decision

### Nativo, aunque el argumento de siempre no aplica

Cada decisión previa a favor del elemento nativo compraba
**comportamiento**: teclado, arrastre, participación en formularios,
validación. Un progress bar **no tiene comportamiento** — es el dibujo de
un número. Así que la comparación honesta no era "nativo vs reimplementar
interacción", sino:

- **Nativo `<progress>`**: semántica gratis y garantizada — el navegador
  mapea `role="progressbar"` y deriva `aria-valuenow`/`valuemin`/`valuemax`
  de `value`/`max`. Costo: pseudo-elementos con prefijo por motor.
- **`<div role="progressbar">`**: tres atributos ARIA escritos a mano.
  Costo: ninguno de estilado.

Un margen mucho más angosto que el que tuvo `<cdz-range>` (ADR-0013).
Ganó nativo por dos desempates, no por el principio:

1. La semántica que provee la plataforma **no puede desincronizarse** del
   valor. Un `aria-valuenow` escrito a mano sí puede quedar viejo cuando
   alguien actualiza `value` y olvida el atributo.
2. Mantiene el costo de estilado **idéntico al ya aceptado** para range,
   en vez de introducir un segundo enfoque para el mismo problema visual.

El costo es real y se paga: no hay pseudo-elementos estandarizados —
verificado que `::progress-bar` y `::progress-value` no existen, mientras
que el par `::-webkit-*` sí. Los dos motores además reparten el trabajo
distinto, y por eso el color del track aparece dos veces en el CSS:
WebKit lo pinta en `::-webkit-progress-bar`, Firefox lo pinta sobre el
elemento y usa `::-moz-progress-bar` para el relleno.

### Tercer falso negativo de una herramienta de medición

`getComputedStyle(el, '::-webkit-progress-bar')` devolvió
`rgba(0,0,0,0)` y `border-radius: 0px` para reglas que **sí estaban
aplicando**. Se resolvió mirando: una captura mostró la barra en lila
contra la nativa en azul, sin ambigüedad.

Es el tercer caso en este proyecto donde la medición programática miente
y la verificación visual gana:

| Caso | Herramienta | Qué pasó |
|---|---|---|
| ADR-0015 | `getComputedStyle` sobre `:visited` | Reporta los valores *no visitados* a propósito, por privacidad |
| ADR-0016 | `getBBox()` | Mide geometría sin el trazo, y aproxima arcos con error de 0.003 |
| ADR-0019 | `getComputedStyle` sobre pseudo-elementos con prefijo | Reporta transparente para reglas que sí aplican |
| ADR-0022 | `getBBox({ stroke: true })` | Chromium **acepta la opción y la ignora**: sin error, devuelve la caja geométrica |

El patrón que queda: **cuando una medición contradice lo que debería
pasar, sospechar primero de la medición.** Todas las veces el código
estaba bien.

La cuarta entrada es la peor de las cuatro, y por eso vale tenerla
presente: las otras tres devuelven un valor plausible pero equivocado; esa
acepta una opción que hace *parecer* que se está midiendo lo correcto. La
prueba que la desenmascara es la misma en todos los casos — buscar un
input cuyo resultado correcto sea imposible de confundir (una línea recta
de trazo 2 tiene que medir 2 de alto, no 0).

### Solo determinado — el indeterminado es `cdz-spinner`

Un `<progress>` sin `value` es indeterminado, y este componente
deliberadamente no lo expone. `appearance: none` —que el estilado
personalizado requiere— **elimina la animación nativa del estado
indeterminado**, así que el resultado sería una barra que parece rota en
vez de ocupada.

El trabajo indeterminado le corresponde a `<cdz-spinner>`, que además ya
resuelve `prefers-reduced-motion` para la animación que ese caso necesita
(ADR-0018). Un test lo fija: verifica que `position` nunca sea `-1`, que
es el valor que delata a un `<progress>` indeterminado.

### `valueText` para cuando el número crudo no sirve

`aria-valuetext` es opt-in, no generado. Un lector de pantalla anunciando
"45" en una subida de archivo es técnicamente exacto e inútil; "45 de 100
MB" es lo que la persona necesita. Solo quien consume el componente sabe
qué cuenta ese número, así que no hay forma de derivarlo.

Cuando no se pasa, el atributo se **omite por completo** en vez de quedar
vacío: un `aria-valuetext=""` pisaría el anuncio que la plataforma ya
hace correctamente, con nada. Hay un test para eso.

La lectura visible (`showValue`) va `aria-hidden`: duplica lo que el
elemento ya anuncia, y exponerla lo haría decir el valor dos veces.

## Consequences

- **Más fácil:** la separación determinado/indeterminado queda explícita
  entre dos componentes, en vez de un solo componente con un modo que se
  comporta distinto.
- **A revisar:** sin variantes de estado. Ahora que existe
  `color.status.*` (ADR-0017), una barra de error o de éxito es
  plausible — pero el color solo no puede ser lo que comunique eso, así
  que habría que resolver antes cuál es la señal no cromática.
- **A revisar:** sin `role="status"` ni anuncio de cambios. Una barra que
  anuncia cada porcentaje sería insoportable; anunciar hitos (25%, 50%)
  es una decisión de producto que el átomo no puede tomar.
- **A revisar:** las reglas `::-moz-progress-bar` siguen sin verificarse
  en Firefox real, igual que las de range — el tooling de este proyecto
  es solo Chrome. Misma deuda, mismo lugar donde se salda.

## Action Items

1. [x] Verificado en navegador qué se puede estilar de `<progress>` antes
   de decidir, incluyendo descubrir que `getComputedStyle` miente sobre
   los pseudo-elementos con prefijo.
2. [x] `component/progress.tokens.json` — reusa los mismos roles
   semánticos que `cdz-range` (`form.border.default` para el track,
   `action.primary.background.default` para el relleno).
3. [x] `<cdz-progress>` (Lit): `<progress>` nativo, `label` obligatorio,
   `valueText` opcional, lectura visible opt-in y oculta para AT, solo
   determinado.
4. [x] Tests: asociación label/for, semántica derivada por la plataforma
   (y que *no* se escriban `aria-valuenow`/`role` a mano), defaults,
   nunca indeterminado, `max` propio, accesible en varios puntos,
   `aria-valuetext` presente y ausente, lectura oculta, porcentaje contra
   `max`, división por cero, y los avisos de label — 185/185.
5. [x] Dogfooding en el sitio y en la galería; verificado en navegador que
   `position` da 0.45 / 0 / 1 / 0.3 y que el porcentaje mostrado se
   calcula contra el `max` propio.
