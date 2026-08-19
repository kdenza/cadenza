# ADR-0022: `<cdz-avatar>` — cuándo el default correcto es el ruidoso

**Status:** Accepted
**Date:** 2026-08-06
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Último átomo del roadmap. Trae tres decisiones que no se parecen a las de
ningún otro componente del sistema: rompe a propósito la regla de
accesibilidad que venían compartiendo los tres anteriores, rechaza un
patrón muy común de la industria por un motivo medible, y es el primero
que tiene que tratar el texto como Unicode de verdad.

## Decision

### Tres formas de dibujarse, y las dos últimas son hermanas

Foto (`src`) → iniciales (de `name`) → ícono genérico de persona. Cuál de
las dos últimas se usa lo elige `fallback`, y **ninguna es una versión
degradada de la otra**: las iniciales dicen *qué* persona, el ícono dice
*una* persona. El segundo caso es real y frecuente — una fila de ejemplo,
una cuenta que todavía no tiene nombre, una entrada deliberadamente
anónima — y forzar iniciales ahí inventa una identidad que no existe.

Si se piden iniciales y el nombre no produce ninguna, cae al ícono. El
peor caso posible sigue siendo una marca con forma de persona, nunca un
círculo vacío.

### Significativo por defecto — al revés que `cdz-icon` y `cdz-divider`

ADR-0021 enunció la regla compartida como *"el default es la opción más
callada"*. Este componente la rompe, y lo que vale la pena guardar es el
refinamiento, no la excepción:

- `cdz-icon` **no puede** tener default significativo, porque no tiene
  ninguna cadena correcta con la que hacerlo. Tendría que inventarla a
  partir del `name` del ícono, y "alert-triangle" leído en voz alta es
  peor que el silencio.
- Este componente **ya exige `name`** — las iniciales salen de ahí — así
  que la opción ruidosa no es una adivinanza. Es el nombre real de la
  persona, ya presente.

Los modos de falla son asimétricos justo en la dirección que decide el
empate. Un avatar anunciado de más repite un nombre que ya estaba en
pantalla: verboso, sin violación. Un avatar callado de más, usado como
único identificador en una pila de avatares o en un botón de cuenta, es
inidentificable: falla 1.1.1.

**La regla, corregida:** el default es callado cuando la opción ruidosa
tendría que adivinarse; es ruidoso cuando la cadena correcta ya está en la
mano.

`decorative` desactiva el anuncio para el caso común de tener el nombre
escrito al lado ("Kyrah Monreal comentó hace 2 horas").

Las iniciales y el ícono no se anuncian nunca, en ninguno de los dos
modos: "KM" no es un nombre, y bajo `role="img"` los descendientes son
presentacionales de todas formas.

### `name` obligatorio, pero solo cuando de verdad se usa

Un avatar decorativo que además cae al ícono genuinamente no tiene nada
que decir, así que avisar ahí sería un falso positivo. Y una advertencia
que grita en falso se termina filtrando, lo cual cuesta más de lo que la
verificación vale. Por eso este componente **no** usa el
`warnIfLabelMissing` compartido: el mensaje de ese helper habla de campos
de formulario, y aquí la condición no es incondicional.

### Sin color derivado del nombre

Hashear un nombre a un tono es el truco más común de la industria para
esta pieza, y es una trampa de contraste: **cada** color generado tendría
que pasar 4.5:1 contra las iniciales en claro *y* en oscuro, y un hash no
puede prometerlo. La metodología de este proyecto es verificar cada par en
el navegador; un espacio de colores infinito no se puede verificar.

Un solo par de la paleta de estado (`color.status.neutral`, ADR-0017), ya
verificado. Medido de nuevo aquí sobre los tres tamaños: **8.26:1 en claro
y 6.37:1 en oscuro**. Es la segunda vez que esa paleta se reusa fuera de
`cdz-badge`, que era exactamente para lo que se creó.

### Iniciales: clústeres de grafemas, y salida normalizada

Primer componente que trata el texto como Unicode y no como una cadena de
caracteres. Dos cosas medidas en el navegador, no supuestas:

| Nombre | `Array.from(w)[0]` | `Intl.Segmenter` |
|---|---|---|
| "ñora garcía" (ñ descompuesta) | **N** — pierde la tilde | **Ñ** |
| "क्षमा शर्मा" | **क** — otra letra | **क्ष** |

`Intl.Segmenter` es lo único que acierta en los dos. Se conserva un
respaldo con `Array.from` porque sin él la falla sería una inicial
incorrecta y no un error, y eso es justo lo que debe degradar en silencio.

La salida se normaliza a **NFC**, para que un mismo nombre produzca una
misma cadena venga en la codificación que venga. Lo encontró un test que
fallaba con `expected 'ÑG' to equal 'ÑG'` — idénticos en pantalla,
distintos en bytes. Los tests de este componente escriben esos casos con
escapes `\u`, no con caracteres literales: un literal ahí solo prueba lo
que el editor haya decidido guardar.

Se toma la primera y la última palabra, así que las partículas se saltan
solas ("Ana de la Cruz" → "AC") sin mantener una lista por idioma.

### La foto va encima del fallback, no en su lugar

El fallback siempre está montado; la imagen se dibuja arriba. Así, durante
la carga hay algo que mirar y nada se recorre cuando llega. `object-fit:
cover` recorta al círculo en vez de estirar, y `flex: 0 0 auto` impide que
un nombre largo al lado lo aplaste en elipse (con test).

**Trampa medida:** asignar `src=""` a un `<img>` dispara `error`, no
silencio. Por eso "sin foto" y "foto rota" son caminos distintos en el
código — con `src` vacío el `<img>` no se renderiza nunca, en lugar de
renderizarlo y manejar su error. Y un `src` nuevo reinicia el estado de
falla, para que una foto rota no envenene a la siguiente.

Los tests provocan el fallo con un data URI que dice ser PNG y no lo es,
no con una URL que da 404: el 404 se resuelve en ~4.8ms contra ~0.3ms del
data URI, y solo el primero depende de un servidor. El componente no
distingue entre los dos casos de todas formas — solo ve `error`.

### El test intermitente, y por qué la primera hipótesis era la equivocada

Vale contarlo completo porque el error de método es más útil que el
arreglo.

La suite empezó a fallar de forma intermitente —3 a 5 tests, solo al
encadenarse tras un build— y en el primer episodio se perdió el detalle
del fallo por filtrar el output. Sin saber **cuáles** tests eran, se
cambió lo que parecía la fuente de fragilidad más obvia (el 404 por red) y
la suite pasó 8 corridas seguidas. Parecía resuelto. No lo estaba: volvió
a fallar en cuanto se volvió a encadenar con un build.

Guardando el log entero, el culpable resultó ser **un solo test**, y por
una razón que ninguna cantidad de reintentos habría revelado:

`fixture()` de `@open-wc` espera a `elementUpdated`, que usa
`el.updateComplete` **si existe** —una microtarea— y si no cae a
`nextFrame()`, o sea `requestAnimationFrame`. Un `<div>` plano no tiene
`updateComplete`. Y este era el **único test de los 234** que montaba un
elemento plano como raíz, así que era el único cuyo resultado dependía de
que el navegador decidiera pintar; bajo carga, rAF se pasaba de los 2s de
mocha mientras el resto de la suite volaba por microtareas.

`fixtureSync` + esperar el `updateComplete` del propio avatar elimina la
dependencia sin debilitar la prueba: `getBoundingClientRect` fuerza layout
de forma síncrona, así que nunca hizo falta un frame. 12 corridas
encadenadas con build, 0 fallos.

Dos lecciones, y la segunda es la que cuesta:

1. **Un test intermitente que pasa después de un cambio no es un test
   arreglado.** Es la trampa clásica: la evidencia de "pasó 8 veces" era
   compatible tanto con haberlo arreglado como con no haberlo tocado.
2. **Nunca filtrar el output de un fallo que no se entiende.** El primer
   episodio se podía haber diagnosticado igual de rápido que el segundo;
   lo único que faltaba era haber guardado el log.

### Un ícono nuevo: `user`

Cabeza y hombros como dos trazos separados en vez de una silueta: a 24px
el contorno de un busto se convierte en una mancha, mientras que dos
marcas con un hueco entre ellas siguen leyéndose como una figura.

Extent con trazo 3→21 horizontal, 2→22 vertical: la altura completa del
área viva, pero 18 de ancho en vez de 20. La asimetría es deliberada — una
persona se lee más alta que ancha, y sacar los hombros hasta 20 lo
volvería el ícono más pesado del set. Auditado a 96px junto a `info` y
`check`.

**Cuarto falso negativo de una herramienta de medición** (la tabla vive en
ADR-0019): `getBBox({ stroke: true })` **acepta la opción y la ignora** en
Chromium 148. No lanza, no advierte — simplemente devuelve la caja
geométrica. Confirmado con el caso definitivo: una línea recta de trazo 2
sigue reportando 0 de alto. El extent se calculó a mano.

## Consequences

- **Más difícil:** la regla de accesibilidad del sistema ya no cabe en una
  frase. Un componente nuevo tiene que preguntarse si la cadena correcta
  existe antes de elegir default, en vez de copiar al vecino. Es más
  trabajo y es el trabajo correcto.
- **Límite conocido:** las iniciales en `sm` miden 9.6px. El contraste
  pasa con holgura (8.26:1), pero 9.6px es chico para leer dos letras.
  Para avatares `sm` el fallback de ícono probablemente lee mejor; no se
  fuerza porque cambiar el fallback según el tamaño sería un
  comportamiento sorpresa.
- **A revisar:** sin variante cuadrada. Es una distinción real en otros
  sistemas (persona redonda, organización cuadrada) y agregaría API que
  todavía nadie pidió.
- **A revisar:** sin pila de avatares (`+3`). Es una molécula: coordina
  varios avatares y necesita su propia semántica de grupo, igual que
  `cdz-radio-group`.
- **Nota de plataforma:** `lib` de TypeScript subió a incluir
  `ES2022.Intl` solo por los tipos de `Intl.Segmenter`. El `target` sigue
  en ES2021 — cambia lo que TS conoce, no lo que emite.

## Action Items

1. [x] Medido en navegador que `src=""` dispara `error`, y comparadas las
   dos estrategias de corte de grafemas antes de escribir el componente.
2. [x] `component/avatar.tokens.json` — tamaños, el par de color reusado
   de la paleta de estado, y dos escalas sin unidad.
3. [x] Ícono `user` en el registro, con el extent calculado a mano y
   auditado a 96px.
4. [x] `<cdz-avatar>` con los tres estados, `decorative`, y la
   advertencia condicional de `name`.
5. [x] Tests: derivación de iniciales (marcas combinantes, clústeres,
   plano astral, espacios, normalización), fallback ante foto rota,
   reinicio al cambiar `src`, `src` vacío, ambos modos de nombre
   accesible, cambio en caliente, circularidad bajo presión de flex y
   accesibilidad en las cinco combinaciones — 234/234.
6. [x] Dogfooding en el sitio y en la galería; contraste releído del
   navegador en ambos modos; axe sin violaciones.
