# ADR-0025: `:host([hidden])` es obligatorio en todo componente que fije `display`

**Status:** Accepted
**Date:** 2026-08-20
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

El sitio recién desplegado mostraba el enlace "Ver la galería de
componentes", que apunta a `http://localhost:5174` y por eso lleva
`hidden` fuera de desarrollo. En producción no debería existir; ahí
estaba, midiendo 217×22 px.

El elemento **sí tenía el atributo**. Lo que fallaba era el CSS.

## Decision

### La causa

`[hidden] { display: none }` vive en la hoja de estilos del **navegador**
(origen UA). Un `:host { display: ... }` dentro de un componente es
**estilo de autor**. En la cascada, autor gana a UA. Así que cualquier
componente que declare `display` en su `:host` **desactiva `hidden` sin
enterarse**.

La contrapartida es una sola regla, que faltaba en **los 18 componentes
que fijan display**:

```css
:host([hidden]) {
  display: none;
}
```

`cdz-popover` queda fuera a propósito: su visibilidad la gobierna la API
de popover vía `:host(:popover-open)`, no `display` en el `:host`.

### El error de método, que importa más que el arreglo

Esta sospecha **ya se había levantado antes en el proyecto, y se retiró
por equivocada**. La verificación de entonces concluyó que `hidden` sí
funcionaba. No funcionaba: se comprobó mal, y la conclusión errónea quedó
escrita como si fuera un falso positivo descartado.

Es el reverso exacto de la lección de ADR-0019 —"cuando una medición
contradice lo esperado, sospechar de la medición"— y merece enunciarse
completa, porque el proyecto solo tenía la mitad:

> Sospechar de la medición vale **en las dos direcciones**. Una medición
> que *confirma* lo que quieres oír merece el mismo escrutinio que una que
> lo contradice. Las cuatro entradas de la tabla de ADR-0019 son casos de
> herramientas que dijeron "está mal" cuando estaba bien. Esta es la
> primera que dijo "está bien" cuando estaba mal, y por eso sobrevivió
> hasta producción.

Y una segunda: **el bug lo encontró el despliegue, no la suite**. 234
tests en verde y ninguno tocaba esto, porque los tests comprobaban
comportamiento de componentes aislados y este fallo solo se manifiesta
cuando alguien *usa* `hidden` de verdad. Es el mismo patrón que ADR-0024:
poner el sistema en un entorno nuevo destapa lo que el entorno conocido
esconde.

### Un test para todo el sistema

`shared/hidden-attribute.test.ts` recorre los 18 componentes y comprueba
dos cosas por cada uno: que `display` computado sea `none`, y que el rect
mida 0×0. Lo segundo no es redundante — es lo que mide *el resultado* en
vez de *la intención*, que es justo la distinción que dejó pasar el bug.

Un solo archivo en vez de 18 casos repartidos: la regla es del sistema, no
de cada componente, y así un componente nuevo que la olvide falla en un
sitio evidente.

## Consequences

- **Impacto en lo ya publicado:** `@kdenza/components@0.1.0` salió a npm
  con el fallo en los 18 componentes. Merece un `0.1.1` — es un arreglo
  puro de comportamiento, sin cambio de API.
- **Más fácil:** `hidden` ya funciona como cualquiera espera, sin que el
  consumidor tenga que descubrir que necesita `style="display:none"`.
- **A revisar:** la misma clase de colisión afecta a otras propiedades que
  el UA aplica y el autor pisa. `:host` con `display` era el caso obvio;
  no se ha auditado si hay otros.

## Action Items

1. [x] Auditados los 19 componentes: 18 fijaban `display` en `:host` y
   **ninguno** tenía `:host([hidden])`.
2. [x] Añadida la regla a los 18, con un comentario que explica el porqué
   en cada archivo (no basta con la regla: sin el motivo, alguien la borra
   por parecer redundante).
3. [x] `shared/hidden-attribute.test.ts`: display computado y rect 0×0 por
   componente — 253/253, estable en 5 corridas.
4. [ ] Publicar `@kdenza/components@0.1.1` con el arreglo.
