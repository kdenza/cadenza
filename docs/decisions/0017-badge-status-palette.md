# ADR-0017: `<cdz-badge>` y la paleta de estado — primera expansión real de la identidad visual

**Status:** Accepted
**Date:** 2026-08-02
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Primer componente de la sección "Feedback" del roadmap, y el primero de
todo el sistema que necesita **variantes semánticas**. Los doce átomos
anteriores tenían *estados* (error, disabled, checked) pero nunca
variantes: cada uno hacía una sola cosa con un solo tratamiento visual.

Eso destapó un hueco real en la identidad: desde ADR-0002 el sistema
tiene lila, rosa, azul, rojo, tinta y neutrales — **no hay verde ni
ámbar**. Un badge de éxito o de advertencia no se podía construir
reusando nada.

## Decision

### Se expandió la paleta, con la misma disciplina de ADR-0002

Es la primera vez desde ADR-0002 que se agregan colores globales, así que
se siguió el mismo método: **contraste calculado antes de elegir**, no
después de que "se viera bien".

Nuevas rampas globales: `green` y `amber` (100/300/700/900 cada una).
`blue` y `red` se extendieron con los escalones que les faltaban
(100/300/700/900 y 100/900 respectivamente), y `neutral` ganó un `200`.

Los tonos se eligieron apagados y cálidos a propósito — un verde salvia y
un ámbar tostado antes que los verdes/amarillos saturados de un framework
genérico — para que convivan con el lila y el rosa de la identidad en vez
de pelearse con ellos.

### Capa semántica nueva: `color.status.*`

`color.status.{neutral,info,success,warning,error}.{background,foreground}`,
bifurcada por modo como el resto de la capa semántica. El badge no
referencia `green.700` nunca: referencia `status.success.foreground`. Eso
es lo que va a permitir que un futuro alert, toast o tabla de estado
compartan exactamente los mismos colores sin volver a decidirlos.

Estrategia por modo: en claro, **fondo tenue + texto fuerte**; en oscuro,
**fondo profundo + texto claro**.

### Los 20 pares, verificados dos veces

Primero con matemática de luminancia relativa antes de escribir un solo
token, y después **releyendo del navegador** los valores computados sobre
el componente ya construido. Los números coincidieron hasta el centésimo,
lo que confirma que el pipeline global → semantic → component → CSS
custom property no deforma nada por el camino.

| Variante | Claro texto/chip | Claro borde/página | Oscuro texto/chip | Oscuro borde/página |
|---|---|---|---|---|
| neutral | 8.26:1 | 9.92:1 | 6.37:1 | 10.01:1 |
| info | 6.95:1 | 7.72:1 | 7.37:1 | 8.26:1 |
| success | 5.45:1 | 5.86:1 | 7.75:1 | 9.20:1 |
| warning | 5.77:1 | 6.16:1 | 7.70:1 | 9.06:1 |
| error | 5.44:1 | 6.04:1 | 4.67:1 | 5.14:1 |

Los diez pares de texto pasan AA (4.5:1) y los diez bordes superan 3:1.

**Un fallo real durante el diseño:** el primer candidato para `neutral` en
oscuro usaba `neutral.400` sobre `neutral.800` → **4.00:1**. Ese par ya
existe en el sistema y ADR-0002 lo tiene registrado como el tratamiento de
*disabled*, donde WCAG 1.4.3 lo exime. Aquí sería texto de contenido real,
sin exención posible. Se resolvió agregando `neutral.200` (6.37:1). El
error es instructivo: **un par de colores aprobado para un rol no viaja
automáticamente a otro rol**, que es exactamente lo que ADR-0002 ya
advertía y volvió a pasar igual.

### El borde comparte el color del texto

Los fondos tenues quedan muy cerca de la página en luminosidad (≈1.1:1),
así que sin contorno el chip no tiene borde localizable. Usar el color del
texto como borde resuelve la definición sin inventar un tercer token, y
garantiza ≥3:1 contra la página gratis: ese color ya tuvo que pasar 4.5:1
como texto.

### El ícono refuerza; no es lo que hace accesible al badge

Aquí hubo una **afirmación mía que había que corregir**. La primera versión
del JSDoc y de la copy del sitio decía que sin ícono las variantes se
comunicarían "solo por color". Es falso: el **texto** del badge
("Completado", "Fallido") ya es una señal no cromática perfectamente
suficiente para WCAG 1.4.1.

Lo que el ícono realmente aporta es una señal de forma que **sobrevive al
escaneo**: en una lista larga de badges, alguien que no separa los tonos
recibe una pista por fila sin tener que leer cada etiqueta. Es una mejora
real, pero es refuerzo, no el mecanismo de cumplimiento.

El riesgo genuino de 1.4.1 es un badge cuyo texto no dice el estado —
`<cdz-badge variant="error">3</cdz-badge>`, donde el rojo es lo único que
significa "errores". Ningún ícono repara eso; la respuesta es que el
estado va en el texto. Queda dicho en el JSDoc porque ninguna API puede
detectarlo.

`hideIcon` es opt-out y no opt-in, para que la disposición reforzada sea
la que sale sin pensarlo.

**Límite conocido del refuerzo a este tamaño:** los íconos del badge van a
`sm` (16px), y ADR-0016 registra que `info` y `alert-circle` no se
distinguen entre sí a ese tamaño. O sea que la señal de forma separa
*info/error* de *success/warning*, pero no separa info de error por sí
sola. El texto sí. Subirlos a `md` lo arreglaría y los dejaría más grandes
que el texto de 14px que acompañan, que se ve peor — la compensación se tomó a
sabiendas.

### No es una live region

El badge renderiza un `<span>` pelado alrededor del texto. Nada de
`role="status"` ni `aria-live`: un badge es **contenido**, y convertir
cada uno en región viva haría que interrumpan lo que la persona está
leyendo. Ese comportamiento le corresponde a un futuro alert/toast, donde
el contenido sí aparece después de cargar la página.

## Consequences

- **Más fácil:** cualquier componente futuro que necesite semántica de
  estado (alert, toast, tabla, tooltip de error) referencia
  `color.status.*` y hereda los contrastes ya verificados.
- **A revisar:** el badge no es descartable. Un badge con "x" para
  cerrarlo es interactivo, necesita foco, `aria-label` en el botón y
  manejo de teclado — eso es una molécula, no este átomo.
- **A revisar:** no hay variante de tamaño. Si aparece la necesidad de un
  badge más pequeño, hay que revisar el tamaño del ícono junto con él (ver el
  límite de 16px arriba), no por separado.
- **A revisar:** `green` y `amber` solo se ejercitan aquí por ahora. Sus
  escalones 300/900 (los del modo oscuro) recién van a probarse de verdad
  cuando un segundo componente los use.

## Action Items

1. [x] Paleta de estado diseñada con contraste calculado antes de elegir;
   un candidato descartado por fallar (4.00:1) y reemplazado por un
   `neutral.200` nuevo.
2. [x] Tres capas: rampas globales nuevas, `color.status.*` semántico
   bifurcado por modo, y `component/badge.tokens.json`.
3. [x] `<cdz-badge>` (Lit): cinco variantes, ícono por defecto en las
   semánticas, `hide-icon` para sacarlo, sin live region.
4. [x] Tests: texto slotteado, neutral sin ícono, ícono correcto por
   variante, opt-out, ícono fuera del árbol de accesibilidad, ausencia de
   role/aria-live, accesibilidad en las cinco variantes, y que las cinco
   resuelvan a cinco colores distintos (un token que fallara en resolver
   pasaría desapercibido de otro modo) — 158/158.
5. [x] Verificado en navegador que los 20 pares computados coinciden con
   la matemática previa, en ambos modos.
6. [x] Corregida una afirmación de accesibilidad sobreestimada en el
   JSDoc y en la copy del sitio.
