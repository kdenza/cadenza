# ADR-0021: `<cdz-divider>` — el mismo default que `cdz-icon`, por la razón contraria

**Status:** Accepted
**Date:** 2026-08-02
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Penúltimo átomo del roadmap, y el más simple que quedaba — pero con una
decisión de accesibilidad que no es obvia y que además ilumina, por
contraste, una que ya se había tomado.

## Decision

### `<hr>` nativo, con sus defaults reseteados

Medidos antes de escribir el CSS: un `<hr>` viene con **8px de margen de
bloque**, `border: 1px inset` y altura 0. Todo eso se resetea, porque el
divisor de un sistema de diseño tiene que verse igual en cualquier
contexto y no heredar decisiones del navegador.

### Decorativo por defecto, semántico solo si se pide

`<hr>` significa "corte temático de nivel párrafo", y la plataforma lo
mapea a `role="separator"`. Pero **la mayoría de las líneas de una
interfaz no son cortes temáticos**: la que separa filas de una lista, o
divide zonas dentro de una tarjeta, es mobiliario visual. Un lector de
pantalla anunciando "separador" una vez por fila convierte una lista en
ruido, y el costo se multiplica con la repetición — cosa que los
divisores hacen más que ningún otro átomo de este sistema.

Así que el default lleva `role="none"`, y `semantic` reactiva el caso
genuino: un cambio real de tema entre secciones.

### Por qué esto no contradice a `cdz-icon`, aunque lo parezca

Los dos componentes terminan en "decorativo por defecto", y las razones
son **opuestas**. Vale escribirlo porque puestos uno al lado del otro se
leen como una regla copiada, y no lo son:

- En `<cdz-icon>` (ADR-0016) el riesgo grave está del lado silencioso:
  un ícono significativo que no se anuncia deja un control que nadie
  puede identificar. El default seguro es el decorativo *porque obliga a
  declarar explícitamente el caso importante*.
- Aquí el riesgo grave está del lado ruidoso: un divisor decorativo
  anunciado se repite decenas de veces. Y el fallo contrario es barato —
  un divisor semántico callado cuesta una pista estructural, mientras
  todo el contenido sigue presente y legible.

La regla que sí comparten, y que conviene recordar en vez de la
conclusión: **el default es la opción más callada**. Cuál de los dos
lados es el callado depende del componente.

### `aria-orientation` solo cuando es vertical *y* semántico

Horizontal es el valor por defecto de un separador, así que declararlo no
aporta nada; y sobre una regla decorativa la orientación no significa
nada en absoluto. Un test cubre las cuatro combinaciones para que esa
condición no se relaje por descuido.

Un divisor vertical necesita altura de algún lado: dentro de una fila
flex se estira solo a la de sus hermanos (`align-self: stretch`, con un
`min-height` de respaldo para que no colapse), y en cualquier otro
contexto la pone quien consume. Verificado en el sitio: los verticales
entre "Perfil / Ajustes / Salir" miden 1×22 px, no 1×0.

### Sin margen propio

El espacio entre el divisor y lo que lo rodea le corresponde al layout
que contiene a ambos. Es la misma razón por la que ningún otro átomo de
este sistema se pone márgenes a sí mismo, y el dogfooding lo demuestra:
las dos demos del sitio espacian con `gap` desde su contenedor.

## Consequences

- **Más fácil:** un divisor nuevo no obliga a pensar en accesibilidad —
  el default correcto es el que sale sin hacer nada.
- **A revisar:** sin variantes de grosor ni de estilo (punteado, etc.).
  Nada lo ha pedido todavía, y `--cdz-divider-thickness` ya permite el
  ajuste puntual sin agregar API.
- **A revisar:** sin soporte para un divisor con texto en medio
  ("── o ──"). Es un patrón real, pero implica contenido slotteado y
  decisiones de alineación que lo acercan más a una molécula que a este
  átomo.

## Action Items

1. [x] Medidos en navegador los defaults del `<hr>` antes de resetearlos,
   y confirmado que la orientación vertical se sostiene de forma fiable.
2. [x] `component/divider.tokens.json` — dos tokens, ambos reusando roles
   existentes.
3. [x] `<cdz-divider>` (Lit): `<hr>` nativo, `role="none"` por defecto,
   `semantic` para el caso real, ambas orientaciones, sin margen.
4. [x] Tests: `<hr>` real, decorativo por defecto, semántico a pedido,
   cambio en caliente entre ambos, las cuatro combinaciones de
   `aria-orientation`, reseteo de los defaults del navegador, grosor en
   ambas orientaciones, ausencia de margen y accesibilidad en los cuatro
   estados — 213/213.
5. [x] Dogfooding en el sitio (horizontal en columna, verticales en una
   fila) y en la galería; verificado que el vertical mide 1×22 y no
   colapsa.
