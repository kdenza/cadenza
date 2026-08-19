# ADR-0020: `<cdz-tooltip>` — dos cosas que no cruzan un shadow root, por la misma razón

**Status:** Accepted
**Date:** 2026-08-02
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Último componente de "Feedback", y el que estaba marcado desde el
principio del roadmap para el final por ser el más difícil de hacer
accesible. Llegó con `<cdz-popover>` (ADR-0010) ya construido, lo que
resolvía posicionamiento y capa flotante — o eso parecía.

## Decision

### El hallazgo que define la arquitectura: el shadow root bloquea dos cosas distintas

La estructura obvia —disparador puesto por quien consume (DOM claro),
burbuja renderizada en el shadow root del componente— **no funciona**, y
falla de dos maneras independientes que resultan tener la misma causa.

**1. La referencia ARIA no cruza.** `aria-describedby` resuelve ids
dentro de un solo *tree scope*. Verificado además que la API moderna,
`ariaDescribedByElements`, existe y está soportada, pero al asignarle un
elemento que vive *dentro* de un shadow root desde un disparador de
afuera **descarta la referencia sin lanzar error**: el arreglo se lee de
vuelta con `length: 0`. La dirección contraria (shadow → claro) sí
funciona; solo se bloquea hacia adentro.

**2. El anclaje visual tampoco cruza.** Esto se descubrió después, y
duele más porque el CSS se veía perfecto: `anchor-name` en el disparador,
`position-anchor` en la burbuja, mismo nombre, y aun así la burbuja
aparecía en (0,0). Aislado con una prueba mínima:

| Disposición | ¿Se ancla? |
|---|---|
| Disparador y burbuja en el **mismo** shadow root (lo que hace `cdz-select`) | Sí — burbuja justo bajo el disparador |
| Disparador en DOM claro, burbuja en shadow root | **No** — burbuja en (0,0) |

`anchor-name` es *tree-scoped*, exactamente igual que los ids. ADR-0010
había documentado que el anclaje funciona "sin importar qué código lo
haya seteado" — cierto, pero solo mientras ambos elementos comparten
scope, que era el caso de `cdz-select` y no es el de un tooltip.

**Consecuencia:** los dos nodos auxiliares —la descripción accesible y la
burbuja visible— se construyen imperativamente como hijos en el **DOM
claro** del componente, compartiendo scope con el disparador. Por eso
`render()` no tiene más que un `<slot>`, y los estilos alcanzan la
burbuja con `::slotted()`.

La descripción se oculta recortándola, nunca con `display: none`: un nodo
no renderizado no está en el árbol de accesibilidad, lo que anularía todo
el arreglo.

El texto queda duplicado entre ambos nodos. `aria-description` (string,
sin referencia por id) eliminaría la duplicación y está soportado en este
navegador, pero su soporte en lectores de pantalla es más joven que el de
`aria-describedby`. Queda como simplificación a revisar.

### Por qué el popover es `manual`

`<cdz-popover>` usa `auto` por defecto, y los popovers `auto` **se
cierran entre sí** — verificado. Un tooltip que apareciera mientras un
`<cdz-select>` está desplegado cerraría el listbox: bug de interacción
real, no hipotético. Los `manual` conviven con los `auto` en ambas
direcciones, así que el tooltip usa `manual` y paga el precio de manejar
Escape por su cuenta.

### WCAG 1.4.13 (Content on Hover or Focus)

Las tres condiciones, deliberadas:

- **Descartable** — Escape cierra sin mover puntero ni foco.
- **Apuntable** — salir del disparador *agenda* el cierre en vez de
  cerrar de inmediato, y entrar a la burbuja lo cancela. Importa sobre
  todo con magnificación de pantalla, donde leer el tooltip puede exigir
  poner el puntero encima.
- **Persistente** — nada lo cierra por temporizador.

El foco abre sin retraso; el hover espera, para que pasar el puntero
sobre una fila de controles no dispare un tooltip por cada uno.

### Lo que no es

Un tooltip no puede contener nada interactivo: no se llega a él ni con
Tab ni como contenedor navegable, así que cualquier cosa enfocable
adentro quedaría inalcanzable. `text` es un string y no un slot
precisamente para que eso sea imposible de equivocar. Un panel flotante
con botones o enlaces es un popover, y `<cdz-popover>` ya es el primitivo
para eso.

### Un artefacto de verificación que casi se lee como bug

Con `.focus()` desde script el tooltip no abría, y el listener de
`focusin` no se disparaba pese a que `activeElement` sí cambiaba. Causa:
cuando el documento no tiene foco, `.focus()` mueve `activeElement` pero
**no emite eventos de foco**. Con un Tab real —tras un clic que le da
foco al documento— abre correctamente.

Vale anotar que los tests unitarios no lo habrían detectado: despachan
`FocusEvent` sintéticos, que saltan el sistema real de foco. Prueban que
el manejador funciona, no que el evento llegue.

## Consequences

- **Más fácil:** queda escrito que shadow DOM bloquea *referencias por
  nombre* en general —ids de ARIA y `anchor-name` de CSS— y no solo una
  de las dos. Cualquier componente futuro que relacione un elemento
  puesto por quien consume con uno propio choca con lo mismo.
- **A revisar:** `aria-description` como forma de eliminar la
  duplicación de texto.
- **A revisar:** sin tooltips en touch. No hay hover, y el foco llega
  solo al tocar, que además activa el control. Los tooltips son
  intrínsecamente un patrón de puntero y teclado; en móvil la
  información debería estar visible o en un popover explícito.
- **A revisar:** la burbuja vive en el DOM claro, o sea que es visible
  para el CSS de quien consume. Es el precio de que el anclaje funcione,
  pero rompe la encapsulación que el resto de los componentes sí tienen.

## Action Items

1. [x] Verificadas en navegador las trampas antes de diseñar: referencias
   ARIA cruzando shadow roots (incluido el descarte silencioso de
   `ariaDescribedByElements`), y que los popovers `auto` se cierran entre
   sí.
2. [x] Descubierto durante la implementación que el anclaje CSS tampoco
   cruza el shadow root, aislado con una prueba mínima, y reestructurado
   el componente para construir ambos nodos en el DOM claro.
3. [x] `<cdz-tooltip>` (Lit): descripción oculta con `role="tooltip"`,
   burbuja `aria-hidden` y `manual`, hover con retraso, foco sin
   retraso, Escape, y cierre agendado para permitir el viaje del puntero.
4. [x] Tests: id que resuelve de verdad desde el documento, ocultamiento
   por recorte, burbuja fuera del árbol de accesibilidad, popover
   `manual`, apertura por foco y por hover, Escape, los tres criterios de
   1.4.13, ids únicos por instancia, sincronización de texto y el aviso
   cuando no hay disparador — 202/202.
5. [x] Verificado en navegador con Tab real y con hover real: abre,
   ancla correctamente bajo el disparador y cierra con Escape.
