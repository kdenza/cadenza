# ADR-0018: `<cdz-spinner>` — el primero que sí se anuncia, y el primero con animación

**Status:** Accepted
**Date:** 2026-08-02
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Segundo componente de "Feedback". Dos cosas lo hacen distinto de los
catorce anteriores: es el primero que debe **anunciarse** a tecnología
asistiva, y el primero con **animación** — o sea el primero donde
`prefers-reduced-motion` deja de ser opcional.

## Decision

### Sí es live region — y `<cdz-badge>` a propósito no lo es

Las dos decisiones son opuestas, tomadas con una semana de diferencia,
por una razón que vale la pena dejar escrita porque es la que hace que
ambas sean correctas:

- Un **badge es contenido**. Ya está ahí cuando la página renderiza.
  Envolverlo en `role="status"` haría que cada badge interrumpa lo que la
  persona está leyendo (ADR-0017).
- Un **spinner es un evento**. Aparece *porque algo empezó*. Ese es
  exactamente el caso para el que existen las live regions.

Así que este renderiza `role="status"` — implícitamente *polite*, nunca
*assertive*: cortar lo que alguien está leyendo jamás se justifica por
"algo está cargando".

El SVG va `aria-hidden`; el label oculto es el que lleva el significado.
El label es traducible, como el `triggerText` de `cdz-file-input`
(ADR-0014) y el aviso de pestaña nueva de `cdz-link` (ADR-0015) — la
aplicación es dueña de su copy.

### Reduced motion: se reemplaza, no se detiene

La rotación es un disparador vestibular clásico, así que bajo
`prefers-reduced-motion: reduce` desaparece por completo en vez de
ralentizarse.

Lo importante es que se **reemplaza** por un pulso de opacidad en lugar
de simplemente frenarse, por dos motivos: un anillo congelado es
indistinguible de uno roto, y el trabajo entero del componente es decir
"esto sigue andando". Un cambio de opacidad no desplaza nada en pantalla,
que es precisamente por qué la guía apunta al *movimiento* y no a toda
animación.

**Verificado leyendo el CSSOM, no asumido por haberlo escrito:**

| Comprobación | Resultado |
|---|---|
| Condición del media rule | `(prefers-reduced-motion: reduce)` |
| Animación bajo esa condición | `cdz-pulse` |
| Keyframes de `cdz-spin` | `100% { transform: rotate(360deg) }` → **mueve** |
| Keyframes de `cdz-pulse` | `50% { opacity: 0.35 }` → **no mueve** |

La afirmación de accesibilidad ("bajo reduced-motion no hay movimiento")
queda probada contra los keyframes reales, no escrita en prosa. Un test
lo fija: falla si alguien reemplaza el pulso por `animation: none` o
deja la rotación viva.

**Un test propio que estaba mal y hubo que arreglar:** la primera versión
comprobaba que el bloque de reduced-motion no contuviera la subcadena
`cdz-spin`. Falla como falso positivo, porque el token
`--cdz-spinner-reduced-motion-duration` **contiene** esa subcadena. Se
cambió por un chequeo con límites de palabra (`/\bcdz-spin\b/`), que no
matchea `cdz-spinner` porque después de `spin` viene un carácter de
palabra. El código siempre estuvo bien; el test era ingenuo — el mismo
tipo de error que el predicado del área viva en ADR-0016.

### Geometría reusada del sistema de íconos

Círculo de radio 9 sobre el mismo lienzo de 24 que `info` y
`alert-circle` (ADR-0016), así un spinner puesto donde estaba un ícono de
estado no cambia de tamaño ni de peso.

El trazo sí se desvía: 2.5 en vez de 2. Un arco fino en movimiento se lee
como parpadeo antes que como indicador deliberado. Es una desviación
consciente de la regla del sistema de íconos, y por eso está dicha aquí.

`pathLength="100"` normaliza la circunferencia para que el dash array se
lea como porcentaje (`25 75` = un cuarto de anillo) en vez de como el
decimal calculado (14.14 de 56.55).

El anillo de fondo usa opacidad y no un segundo token de color: un color
fijo se rompería apenas el spinner cayera adentro de un botón relleno.
Verificado en el navegador — el spinner dentro de `<cdz-button>` computó
`rgb(44, 34, 48)` mientras los sueltos computaron `rgb(240, 230, 234)`,
que es `currentColor` haciendo su trabajo.

## Consequences

- **Más fácil:** el contraste entre esta decisión y la de `cdz-badge`
  deja escrito el criterio para el resto de la sección Feedback —
  ¿el componente ya está cuando carga la página, o aparece porque algo
  pasó? Eso decide si lleva live region.
- **Fuera de alcance a propósito — sin delay de aparición.** Un spinner
  que parpadea por un request de 60ms es peor que ninguno, pero el
  arreglo le corresponde a quien sabe cuánto tarda la operación, no al
  átomo.
- **Fuera de alcance a propósito — nada anuncia el final.** Quitar el
  spinner es silencioso. Un flujo que necesite "listo" tiene que decirlo
  por su cuenta; el átomo no puede saber si terminó bien o mal.
- **A revisar:** no hay variante determinada (con porcentaje). Eso es
  `role="progressbar"` con `aria-valuenow`, semántica distinta y otro
  componente — el Progress que sigue en el roadmap.
- **A revisar:** las live regions dentro de shadow roots abiertos se
  anuncian bien en los lectores de pantalla actuales, pero es un área
  donde el soporte históricamente varió. Vale una prueba con lector real
  cuando haya uno disponible en este entorno.

## Action Items

1. [x] `component/spinner.tokens.json`: tamaños, grosor, opacidad del
   track y las dos duraciones (normal y reduced-motion).
2. [x] `<cdz-spinner>` (Lit): `role="status"` polite, label oculto
   traducible, SVG `aria-hidden`, geometría compartida con el sistema de
   íconos, `currentColor`.
3. [x] Reduced motion resuelto reemplazando la rotación por un pulso de
   opacidad, verificado contra los keyframes reales vía CSSOM.
4. [x] Corregido un test propio que daba falso positivo por comparar
   subcadenas contra un nombre de token que las contiene.
5. [x] Tests: live region polite, label por defecto y traducido, label
   oculto pero en el árbol, SVG oculto, grilla e `pathLength`,
   `currentColor`, escala de tamaños, animación por defecto, y las dos
   comprobaciones de reduced-motion — 170/170.
6. [x] Dogfooding en el sitio (tamaños, dentro de un botón heredando
   color) y en la galería; verificado en navegador que los tamaños
   renderizan 16/20/24 y que el color se hereda del contexto.
