# ADR-0016: Sistema de íconos — SVG sobre icon font, grilla 24, y normalización de los tres que ya existían

**Status:** Accepted
**Date:** 2026-07-30
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Antes de construir `cdz-icon` había que decidir de qué está hecho un
ícono en Cadenza. La pregunta llegó desde la experiencia previa de la
owner: usar una icon font tipo Font Awesome y personalizar desde ahí, que
es lo que se hacía en su trabajo anterior.

Además, ya había tres íconos escritos a mano —el chevron de `cdz-select`,
el check/dash de `cdz-checkbox` y el de link externo de `cdz-link`—
creados en momentos distintos, sin reglas comunes.

## Decision

### SVG, no icon font

Verificado en el navegador antes de decidir, no asumido:

- Una icon font ubica sus glifos en el **Private Use Area** de Unicode
  (el codepoint típico de Font Awesome es `U+F015`). Para el navegador
  eso **es texto**, no un gráfico: queda un carácter sin significado en el
  DOM, que es lo que lee un lector de pantalla y lo que se copia al
  portapapeles.
- El modo de falla decisivo: si una persona activa una fuente propia
  (OpenDyslexic por dislexia, o alto contraste de Windows), la icon font
  **se reemplaza** y cada ícono se vuelve una letra al azar o un
  cuadradito vacío. Se rompe exactamente para quienes activaron esa ayuda
  porque la necesitan — inaceptable en un sistema cuya premisa es
  accesibilidad desde cada commit.

SVG además resuelve mejor la personalización que motivaba la pregunta
original: con `currentColor` el ícono hereda el color del contexto y es
tokenizable, admite multicolor, y escala nítido. Una icon font limita a
color y tamaño.

**Matiz justo:** el problema es la *webfont*, no Font Awesome. FA6 ofrece
API de SVG, así que esa familia seguiría siendo viable por esa vía. Se
descartó por licencia (los íconos free son CC BY 4.0, o sea atribución
obligatoria en un portafolio público) y por peso de dependencia, no por
calidad.

### Los sprite sheets quedan descartados por el shadow DOM

Verificado: `<use href="#icono">` apuntando a un sprite en el documento
**no cruza la frontera del shadow DOM**. El mismo markup renderizó
20×19px en el DOM normal y **0×0** dentro de un shadow root. Como todos
los componentes de Cadenza viven en shadow roots, esa arquitectura —muy
común en otros sistemas— no es viable aquí. Los paths se importan como
datos desde un registro compartido en su lugar.

### La grilla

| Regla | Valor |
|---|---|
| Lienzo | 24×24 |
| Área viva | 20×20 (2 unidades de aire) |
| Grosor de trazo | 2, constante **relativo al lienzo** |
| Terminales y uniones | redondas |
| Radio de esquina | 2 |

Sin `fill`: todos los íconos son solo trazo, así un único `currentColor`
sobre el `<svg>` colorea todo y hereda del contexto gratis.

**Corrección a la regla, encontrada al verificar:** el área viva acota el
**trazo**, no la geometría del path. Un trazo de 2 está centrado sobre el
path, así que agrega 1 unidad por lado; medir solo con `getBBox()`
subestima exactamente eso. La primera redacción de la regla no lo decía y
daba falsos "cumple".

### La deriva que se corrigió

Los tres íconos existentes, medidos antes de normalizar:

| Ícono | Lienzo | Trazo | Trazo ÷ lienzo | Trazo renderizado |
|---|---|---|---|---|
| chevron (`cdz-select`) | 12 | 1.5 | 12.5% | 1.5px |
| check (`cdz-checkbox`) | 16 | 2 | 12.5% | 2px |
| external-link (`cdz-link`) | 12 | 2 | **16.7%** | 2px |

Dos lienzos, dos grosores, y un ícono un tercio más pesado que los otros
—escrito, además, el mismo día que se redactó este sistema, lo cual dice
bastante sobre lo fácil que es que esto derive sin reglas escritas.

Después de normalizar, los tres miden idéntico en el navegador: lienzo
24, caja renderizada 16px, trazo 2 unidades → **1.33px reales** en los
tres casos.

### `external-link` necesitó corrección a mano

Con las reglas aplicadas mecánicamente el ícono seguía leyéndose más
pesado que el resto: una forma **cerrada** pesa ópticamente más que un
trazo abierto aunque ocupe los mismos límites, y su extensión llegaba
justo al borde del área viva (3→22) mientras chevron y check quedaban
holgados. Se redibujó una unidad más adentro arriba y a la derecha
(3→21, 3→20).

Esto es la parte que ninguna regla automatiza: **el balance óptico no es
el balance aritmético**. Un círculo tiene que ser levemente más grande
que un cuadrado para *parecer* del mismo tamaño, y una forma cerrada
tiene que ser levemente más pequeña que una abierta.

Se encontró renderizando el set completo a 96px, lado a lado, con el área
viva dibujada encima — a 16px el problema era invisible. Ese contact
sheet es la herramienta de verificación real para íconos, no la medición
puntual.

### Los tamaños de render se unificaron

El chevron pasó de 12px a 16px, y el ícono de link externo de `0.75em` a
`1em`, para que los tres rindan el mismo grosor real. El de link se
dimensiona en `em` a propósito: es un ícono inline y tiene que escalar
con la oración en la que vive, por la misma razón que `cdz-link` hereda
su tipografía (ADR-0015).

## Consequences

- **Más fácil:** `shared/icons.ts` ya es el registro que va a leer
  `cdz-icon` (registro interno + prop `name`, la opción elegida). El átomo
  se reduce a tamaño, color y semántica accesible.
- **Más fácil:** un ícono nuevo ahora es aplicación mecánica de reglas
  escritas, no una decisión desde cero.
- **A revisar:** el set actual son cuatro íconos y todos existían por
  necesidad de un componente. La decisión de dibujar a mano vs. tomar
  geometría de un set MIT (Lucide) sigue abierta y se decide con más
  íconos sobre la mesa.
- **A revisar:** el radio de esquina 2 hoy solo lo ejercita
  `external-link`. Si un ícono futuro necesita otro radio, conviene
  confirmar que el valor sigue siendo el correcto para todo el set antes
  de romper la regla.
- **A revisar:** no hay test automático que verifique que un ícono nuevo
  respeta el área viva. Es verificable programáticamente (`getBBox()` +
  medio trazo) y sería un buen guardián, pero se hizo a mano aquí.

## Action Items

1. [x] Verificados en navegador los dos hechos decisivos: el codepoint PUA
   de las icon fonts, y que `<use>` no cruza el shadow DOM.
2. [x] Grilla definida y escrita en `shared/icons.ts`, con la corrección
   de que el área viva acota el trazo y no la geometría.
3. [x] Los tres íconos existentes migrados al registro; medido en el
   navegador que los tres rinden 1.33px de trazo (antes 1.5 / 2 / 2).
4. [x] `external-link` redibujado por balance óptico tras auditarlo a
   96px con el área viva superpuesta.
5. [x] Build y suite completa verdes (137/137) y verificación visual en
   contexto de los tres componentes afectados.
6. [x] Construir `cdz-icon` sobre este registro — ver la enmienda.
7. [ ] Evaluar un test que verifique automáticamente el área viva de cada
   ícono del registro.

## Amendment (2026-07-30): `<cdz-icon>`

El átomo que envuelve el registro. Se quedó con exactamente tres
responsabilidades —tamaño, color y significado— porque la geometría y las
reglas de grilla ya viven en `shared/icons.ts`.

### Decorativo por defecto, significativo a pedido

La decisión central de la API, y es deliberadamente asimétrica:

- **Sin `label`** → el ícono es decoración: `aria-hidden="true"`, sin rol,
  no aporta nada al árbol de accesibilidad. Es lo correcto la mayoría de
  las veces — el chevron al lado de "País", el check dentro de un
  checkbox y la flecha de link externo están todos junto a un texto que
  ya dice lo mismo, y anunciarlos de nuevo es ruido.
- **Con `label`** → el ícono es lo único que comunica esa información:
  `role="img"` + `aria-label`. Existe para el caso del control que es
  solo ícono.

El default es el seguro a propósito. Un ícono decorativo anunciado de más
molesta; un ícono significativo que no se anuncia deja un control que una
persona usuaria de lector de pantalla no puede identificar. Y exigir que
el caso significativo lleve un string escrito a mano es lo que obliga a
que ese string exista: una API que dedujera el label del `name` diría
"external-link" en voz alta, que es peor que nada.

### El color no es una prop

El SVG pinta con `currentColor`, así que el ícono toma el color del texto
donde esté y sigue light/dark solo. Verificado en el navegador, no
asumido: el mismo `<cdz-icon name="dash">` dentro de un contexto de error
computó `rgb(217, 110, 104)` mientras los demás computaron
`rgb(240, 230, 234)`. Ese es el beneficio concreto de haber elegido SVG
sobre icon font — una font solo podría haber coloreado el glifo entero de
una.

### Escala de tamaños

`sm` 16px · `md` 20px (default) · `lg` 24px, más `inherit` (`1em`).
Medidos en el navegador: 16 / 20 / 24, e `inherit` dando 16px junto a
texto de 16px y 32px junto a texto de 32px.

`inherit` es de primera clase y no un override: el ícono externo de
`cdz-link` ya lo había necesitado (ADR-0015), así que la necesidad estaba
demostrada antes de que existiera la opción.

### El contact sheet ahora vive en la galería

La auditoría que destapó el problema de peso óptico de `external-link` se
hizo con un overlay temporal inyectado a mano en la página. Esa misma
vista quedó como sección permanente de `@kdenza/gallery`: todos los
íconos del registro a 96px con el área viva superpuesta, generada desde
`shared/icons.ts` para que un ícono nuevo aparezca solo. También el
dropdown de `name` en los controles se puebla desde el registro.

Es el único lugar donde la galería lee código fuente en vez del manifest:
los nombres de íconos son datos en un registro, no un union de TypeScript
que el analyzer pueda leer, y hardcodearlos quedaría desactualizado al
primer ícono nuevo.

### Un nombre desconocido no renderiza nada y grita

Mismo contrato que los chequeos de `label`/`href` faltantes:
`console.error` con la lista de nombres disponibles, nunca `throw`.
Renderizar una caja vacía en silencio convertiría un typo en un misterio
de layout.

### Tests

Doce casos, incluyendo uno que recorre **todo** el registro y verifica que
cada ícono se renderice sobre la grilla compartida — así un ícono nuevo
agregado con otro `viewBox` rompe el test en vez de romper la coherencia
óptica en silencio. 148/148 en total.

## Amendment (2026-08-02): primer lote dibujado con las reglas

Cinco íconos nuevos, elegidos por lo que la sección Feedback del roadmap
va a necesitar: `x`, `chevron-up`, `info`, `alert-circle` y
`alert-triangle`. El set queda en nueve.

`chevron-up` comparte footprint exacto con `chevron-down` (14×8 con
trazo), para que un control que cambia de dirección no cambie de peso.

Los tres de estado se dibujaron como **una familia**, no como tres íconos
sueltos: mismo radio de círculo, misma longitud de barra, misma altura
total de contenido (8→16). Solo varían dos cosas, y las dos significan
algo — el contenedor dice cuán fuerte es (círculo neutro, triángulo más
urgente), y la marca dice de qué tipo es (`info` es una "i" con el punto
arriba; las alertas son "!" con el punto abajo). Invertir ese par es lo
que evita que `info` y `alert-circle` sean el mismo ícono dos veces.

### Dos cosas que aparecieron al medir

**Los círculos "desbordaban" el área viva, pero no.** El audit reportaba
`insideLiveArea: false` para `info` y `alert-circle`. Medido sin
redondear, el desborde era de **0.003 unidades** sobre una grilla de 24:
el error de aproximación de arcos a curvas de Bézier del navegador. El
triángulo, que son rectas puras, mide exactamente 2→22 con cero
desborde. Los círculos cumplen; el predicado de auditoría era ingenuo al
comparar con `<=` exacto contra un número que sale de aplanar curvas. El
test pendiente del área viva (action item 7) necesita una tolerancia.

**El piso de legibilidad de 16px se rompe para un par, y no tiene
arreglo por dibujo.** `info` y `alert-circle` no se distinguen entre sí a
`size="sm"`. Lo que las diferencia —cuál extremo lleva el punto— ocupa
unas 3 unidades de grilla, que a 16px son ~2px reales, por debajo de lo
que un trazo de 1.33px puede expresar.

Se probaron tres redibujos (barra más larga, más separación punto-barra,
separación mayor con barra corta) renderizando los pares alternados a
16px. **Ninguno cambió el resultado**, y eso es lo que lo convierte en un
límite y no en un problema de dibujo. A `md` (20px) y arriba el par lee
bien.

La regla que queda: **usar `md` o mayor cuando estos dos tengan que
distinguirse entre sí por forma.** En la práctica los componentes que los
van a usar (badge, alert) siempre acompañan el ícono con texto — que es
justo por qué `cdz-icon` los trata como decorativos por defecto: el ícono
apoya el mensaje, no lo carga. El color también difiere entre ambos, pero
como segunda señal, nunca como única (WCAG 1.4.1).

Esto es el mismo tipo de hallazgo que el peso óptico de `external-link`:
invisible a tamaño real hasta que se mira con la herramienta adecuada.
La diferencia es que aquel se arreglaba redibujando y este no.
