# Cadenza

Design system + portfolio de UX Engineering. El sitio es su propio caso de
estudio: tokens → componentes → sitio, construido con prácticas de equipo
enterprise.

## Stack y paquetes

Monorepo con **npm workspaces** (migrado desde pnpm, ver ADR-0006). Node
18.19.1 en el sistema, Node 24 LTS disponible en este entorno — ver
"Restricciones del entorno" antes de tocar versiones de herramientas.

| Paquete | Qué es | Stack | ¿Se publica? |
|---|---|---|---|
| `@kdenza/tokens` | Design tokens W3C DTCG → CSS custom properties (light + dark) | Style Dictionary 5.x | Sí, npm público |
| `@kdenza/components` | Web Components, prefijo `cdz-` | Lit 3 + TypeScript, sin decoradores | Sí, npm público |
| `@kdenza/gallery` | Visor de componentes con auditoría de accesibilidad en vivo | custom-elements-manifest + axe-core | No (privado) |
| `@kdenza/site` | Portafolio (consume los componentes) | Vite 8 + TS | No (privado) |

## Comandos

```bash
npm install
npm run build      # tokens → components → analyze → site
npm run dev        # sitio en modo desarrollo (puerto 5173)
npm run gallery    # galería de componentes (puerto 5174)
npm test           # tests de componentes (@web/test-runner + axe-core)
```

Para publicar una nueva versión o consumir los paquetes desde otro
proyecto, ver [docs/publishing.md](docs/publishing.md) — **ninguna
credencial (token de npm, PAT de GitHub) se pega en una conversación con
Claude ni se comitea**: `npm login` va en tu propia terminal. Un token
pegado en un chat hay que considerarlo comprometido y rotarlo.

## Convenciones

- Prefijo de componentes: `cdz-`. Scope de paquetes: `@kdenza/*` (la
  organización en GitHub es `kdenza`, no la cuenta personal; `cadenza` ya
  estaba tomado — ver ADR-0006).
- Tokens en 3 capas: `global` (primitivos) → `semantic` (roles) → `component`
  (por componente). Nunca saltarse una capa — un componente nuevo referencia
  `semantic`, no `global` directamente.
- Componentes Lit **sin decoradores**: `static properties = {...}` + campos
  `declare` (no `@property()`). Es deliberado — evita el bug de
  class-field-shadowing de Lit sin depender de flags de `tsconfig`/bundler.
  Ver cualquier `*.ts` de un componente para el patrón exacto.
- Cada componente documenta en el JSDoc de su clase **qué patrón ARIA
  implementa y por qué** (no qué hace — eso ya lo dice el código).
- Formularios (`cdz-input`, `cdz-checkbox`) exigen `label`: `console.error`
  si falta, nunca `throw` (un prop mal usado no debe tumbar el resto de la
  página). Ver ADR-0003.
- `disabled`: `cdz-button` usa `aria-disabled` (se queda enfocable, para que
  un lector de pantalla descubra que la acción existe); los campos de
  formulario usan `disabled` **nativo** (excluye el valor de `FormData`). Es
  una divergencia a propósito entre componentes, no una inconsistencia.
- Light/dark se modela en la capa `semantic`
  (`color.*.light.tokens.json` / `color.*.dark.tokens.json`), nunca en el
  componente. El cambio de modo por preferencia del SO es
  `@import ... (prefers-color-scheme: dark)` — cero JavaScript. Encima de
  eso hay un override manual (botón en el sitio): Style Dictionary genera
  además `tokens-dark-forced.css`/`tokens-light-forced.css` con selector
  `[data-theme="..."]` en vez de `:root` (mayor especificidad que un
  `:root` aunque esté detrás de un media query), y un script inline
  síncrono en el `<head>` de cada página aplica el `data-theme` guardado
  en `localStorage` (`cdz-theme`) antes del primer paint, para evitar
  FOUC. Ver la enmienda de ADR-0002.
- `custom-elements.json` es un artefacto generado (`.gitignore`d, como
  `dist/`, pero sí se incluye en el paquete publicado — ver ADR-0006) —
  regenerar con `npm run analyze -w @kdenza/components` después de
  cambiar cualquier prop/evento de un componente.
- `@kdenza/tokens` y `@kdenza/components` tienen versión real (semver) y
  `publishConfig` porque se publican; `@kdenza/site` y `@kdenza/gallery`
  son `"private": true` y nunca se publican.

## Restricciones del entorno

El sistema tiene Node 18.19.1 en `/usr/bin/node` (root, no tocar sin sudo).
Además hay **Node 24 LTS instalado en `~/.local/share/node-v24`**, con
prioridad en el `PATH` (`~/.bashrc`) — cualquier shell nueva ya usa Node 24
por defecto. `npm`, `gh`, y todo el pipeline del proyecto ya se verificaron
funcionando bajo Node 24.

Las versiones de herramientas **ya están al día** (agosto 2026):
style-dictionary 5.x, vite 8.x, TypeScript 7.x, `@web/test-runner` 1.x +
`@web/test-runner-chrome` (en vez de playwright), axe-core 4.13. `npm
audit` reporta **0 vulnerabilidades**; el rezago anterior había crecido a
9 advisories (8 high), incluida una de prototype pollution en
style-dictionary 4.x. Ver ADR-0023.

Dos cosas que se aprendieron subiendo y conviene no volver a tropezar:

- **Vite 8 ya no queda hoisted a la raíz del workspace.** El binario vive
  en `packages/<pkg>/node_modules/.bin/vite`; cualquier script o config
  que apunte a `../../node_modules/.bin/vite` se rompe.
- **TypeScript 7 emite exactamente lo mismo que 5.9** para este proyecto
  (41 archivos idénticos byte a byte), incluida la emisión de campos de
  clase de la que depende el patrón sin decoradores de Lit. Era el riesgo
  real del salto y no se materializó.

## Decisiones de arquitectura

Registro completo en [`docs/decisions/`](docs/decisions) (ADRs). Empezar
ahí antes de asumir el porqué de algo no obvio:

- **0001** — monorepo + Style Dictionary + Lit (la parte de pnpm quedó
  reemplazada por 0006).
- **0002** — identidad visual (lila/rosa/azul), Figtree + Source Sans 3,
  tokens de doble modo (light/dark).
- **0003** — patrón de `cdz-input`; enmienda: enforcement de `label`
  obligatorio.
- **0004** — `@kdenza/gallery`: por qué custom-elements-manifest + axe-core
  en vez de Storybook/Histoire. Enmienda: link a la galería desde el
  sitio, visible solo en desarrollo local (`import.meta.env.DEV`) —
  sigue sin desplegarse junto al sitio.
- **0005** — `cdz-checkbox`: `indeterminate` imperativo, cero tokens nuevos.
- **0006** — pnpm → npm, y publicar `@kdenza/tokens`/`@kdenza/components`
  bajo el scope `@kdenza` (`cadenza` ya estaba tomado en GitHub).
  **Enmienda:** el destino pasó de GitHub Packages al **registry público
  de npm**, porque GitHub Packages exige autenticarse para *instalar*
  incluso paquetes públicos — fricción que anula el objetivo de que el
  sistema sea consumible desde un portafolio. Implica `access: "public"`
  (los paquetes con scope son privados por defecto) y licencia MIT real.
  De paso se encontró un bug latente: el `.npmrc` mapeaba `@cadenza`, un
  scope que ya no existía.
- **0007** — `cdz-radio`: la agrupación nativa de radios no cruza shadow
  roots — limitación real, documentada y verificada con test, no un bug.
  La coordinación real queda para una futura molécula `cdz-radio-group`.
- **0008** — `cdz-text`: `as` (tag semántico) y `size` (estilo visual)
  independientes — primera vez con tokens tipográficos genuinamente
  nuevos (`heading-2/3`, `body-lg/sm`) en varios átomos.
- **0009** — `cdz-select` (v1, superada por 0010): `options` es propiedad
  JS (no slot, limitación real de `<select>`+shadow DOM); el popup abierto
  no se podía restylear (límite real de plataforma, en ese momento sin
  resolver). Se extrajo `warnIfLabelMissing` compartido
  (`shared/required-label.ts`) y se retrofitteó Input/Checkbox/Radio.
- **0010** — `cdz-popover`: primitivo genérico (no es átomo, categoría
  aparte en `docs/roadmap.md`), agnóstico de ARIA, basado en el atributo
  `popover` + CSS Anchor Positioning (verificado en navegador, no
  asumido). `cdz-select` se reconstruyó sobre él con el patrón APG
  "Select-Only Combobox" — resuelve la limitación de estilo del popup que
  ADR-0009 había dejado documentada como límite real, no arreglada.
- **0011** — `cdz-textarea`: mismo patrón que `cdz-input`, cero tokens
  nuevos. La única decisión genuinamente nueva es `resize: vertical`
  (nunca `both`, para no romper el layout) y `rows` en vez de `type`.
- **0012** — `cdz-switch`: `role="switch"` sobre un
  `<input type="checkbox">` nativo (mismo enfoque que checkbox, sin
  indeterminate). Cero tokens de color nuevos, pero requirió verificar
  contraste real: ningún color fijo de thumb pasa 3:1 contra los 4 combos
  track-on/off × light/dark — el rol ya existente
  `color.action.primary.text.default` (el mismo del check de checkbox)
  sí los resuelve todos.
- **0013** — `cdz-range`: el control nativo más fragmentado para
  restylear (verificado que los pseudo-elementos sin prefijo todavía no
  existen, hace falta `::-webkit-*`/`::-moz-*` duplicado). Reusa
  directamente la tabla de contraste de ADR-0012 para el thumb (mismos 4
  colores). Encontrado y arreglado un bug real de orden de bindings:
  `.value` se aplicaba antes que `min`/`max` en el template, y como
  lit-html aplica bindings en orden, el valor se clampeaba contra el
  `max` nativo por defecto (100) en el primer render. Sin `required` a
  propósito (un range nunca está "vacío"). De paso, arregla un gap real
  en la galería: los props `number` se asignaban como string crudo desde
  el control de texto genérico (afecta también a `rows` de textarea).

- **0014** — `cdz-file-input`: el `value` no se puede setear (barrera de
  seguridad del navegador, no decisión de diseño) → `files` de solo
  lectura + `clear()`. El input nativo queda recortado (nunca
  `display:none`, que lo sacaría del tab order) y el chrome visible lo
  dibuja el componente, porque el texto "sin archivos" vive en un shadow
  root **cerrado** y lo localiza el navegador, no la app. Primer caso
  donde se acota una regla de axe a propósito: el contraste de disabled
  (3.03:1, exento por WCAG 1.4.3 y usado por los 10 átomos) solo se
  marca aquí porque el texto está en spans decorativos.

- **0015** — `cdz-link`: primer átomo que **hereda** tipografía en vez de
  imponerla (es contenido inline). Sin `disabled` (no existe en HTML para
  enlaces — `aria-disabled` no impide el click y sacar `href` destruye la
  semántica; para eso está `cdz-button disabled`). `target="_blank"`
  agrega `rel="noopener"` (fusionado, no pisado) y un aviso accesible
  traducible. Sin `:visited`: el navegador miente a propósito en
  `getComputedStyle` para evitar history sniffing, así que sería el único
  color del sistema imposible de verificar con la metodología del proyecto.

- **0016** — sistema de íconos: SVG, **nunca** icon font (una icon font
  usa el Private Use Area de Unicode, así que para el navegador es texto,
  y se rompe entera si alguien activa una fuente propia tipo
  OpenDyslexic). Los sprite sheets también quedan descartados:
  verificado que `<use href="#id">` no cruza el shadow DOM. Grilla 24×24,
  área viva 20×20 (acota el **trazo**, no la geometría), stroke 2
  constante, terminales redondas. Registro en
  `components/src/shared/icons.ts`. Enmienda: `cdz-icon` construido sobre
  ese registro — **decorativo por defecto** (`aria-hidden`), significativo
  solo si le pasás `label` (`role="img"` + `aria-label`). Color por
  `currentColor`, sin prop. La galería tiene un contact sheet de todo el
  set a 96px con el área viva superpuesta: es la herramienta para juzgar
  peso óptico al dibujar íconos nuevos (a tamaño real no se ve).

- **0017** — `cdz-badge` + paleta de estado: primer componente con
  **variantes semánticas**, y primera expansión de la paleta desde
  ADR-0002 (no había verde ni ámbar). Capa semántica nueva
  `color.status.*`, bifurcada por modo — cualquier alert/toast/tabla
  futura la reusa. Los 20 pares verificados dos veces (matemática antes
  de elegir, y releídos del navegador después). El ícono **refuerza** la
  variante para el escaneo, pero el que cumple 1.4.1 es el texto del
  badge — no sobreestimar eso.

- **0018** — `cdz-spinner`: primero que **sí** es live region
  (`role="status"` polite), opuesto a badge a propósito — un badge ya
  está cuando carga la página, un spinner aparece porque algo empezó. Ese
  es el criterio para el resto de Feedback. Primero con animación: bajo
  `prefers-reduced-motion` la rotación se **reemplaza** por un pulso de
  opacidad (no se congela — un anillo quieto parece roto), verificado
  leyendo los keyframes del CSSOM.

- **0019** — `cdz-progress`: `<progress>` nativo. Primer caso donde
  "nativo primero" **no** se aplicó por inercia: aquí lo único que se gana
  es semántica (no comportamiento), así que ganó por dos desempates
  concretos, no por el principio. Solo determinado — el indeterminado es
  `cdz-spinner`, porque `appearance: none` mata la animación nativa de
  ese estado. Documenta el tercer falso negativo de una herramienta de
  medición (ver la tabla en el ADR): cuando una medición contradice lo
  esperado, sospechar de la medición primero.

- **0020** — `cdz-tooltip`: el hallazgo central es que **el shadow DOM
  bloquea las referencias por nombre en general** — tanto los ids de
  `aria-describedby` como el `anchor-name` de CSS Anchor Positioning son
  *tree-scoped*. Por eso el tooltip construye sus dos nodos auxiliares
  (descripción accesible y burbuja) en el **DOM claro**, no en su shadow
  root. Ojo: `ariaDescribedByElements` descarta una referencia hacia
  adentro de un shadow root **en silencio**, sin error. Usa
  `popover="manual"` porque los `auto` se cierran entre sí y cerraría un
  `cdz-select` abierto.

- **0021** — `cdz-divider`: **decorativo por defecto** (`role="none"`),
  semántico solo si se pide. Llega al mismo default que `cdz-icon` por la
  razón **contraria**: en el ícono el riesgo grave es el silencio (un
  control que nadie puede identificar), aquí es el ruido (un "separador"
  anunciado una vez por fila). La regla que sí comparten, y la que hay
  que recordar: el default es la opción más callada — cuál lado es el
  callado depende del componente. Sin margen propio: el espaciado le
  toca al layout.

- **0022** — `cdz-avatar`: **significativo por defecto**, rompiendo a
  propósito la regla que 0016 y 0021 venían compartiendo. El refinamiento
  es lo que hay que recordar: *el default es callado cuando la opción
  ruidosa tendría que adivinarse* (`cdz-icon` tendría que inventar un
  label desde el `name` del ícono) *y ruidoso cuando la cadena correcta ya
  está en la mano* (aquí `name` es obligatorio para las iniciales, así que
  el nombre real ya está). Sin color derivado del nombre por hash: cada
  color generado tendría que pasar 4.5:1 en ambos modos y un hash no lo
  puede prometer. Primer componente que trata el texto como Unicode
  (`Intl.Segmenter` para clústeres de grafemas, salida en NFC). Trampa
  medida: `src=""` en un `<img>` dispara `error`, no silencio. Cuarto
  falso negativo de medición: `getBBox({ stroke: true })` acepta la opción
  y la ignora.

- **0023** — subida de todas las herramientas: el rezago de ADR-0006 había
  crecido de 2 a **9 advisories** (8 high, incluido prototype pollution en
  style-dictionary 4.x). Ahora **0**. Lo transferible es el método:
  comparar artefactos generados byte a byte contra una línea base, no
  confiar en que "compila". TypeScript 7 emitió los 41 `.js` idénticos a
  5.9, que es la única prueba real de que no rompió la emisión de campos
  de clase de la que depende Lit sin decoradores.

## Checklist de átomos

Ver [docs/roadmap.md](docs/roadmap.md) — las cinco categorías de átomos
están cerradas; lo que sigue son moléculas.

## Estado actual

**18 átomos completos, las cinco categorías cerradas** — "Formularios",
"Texto y navegación", "Feedback", "Medios" y "Estructura":
`cdz-button`, `cdz-input`, `cdz-checkbox`, `cdz-radio`, `cdz-text`,
`cdz-select`, `cdz-textarea`, `cdz-switch`, `cdz-range`,
`cdz-file-input`, `cdz-link`, `cdz-icon`, `cdz-badge`, `cdz-spinner`,
`cdz-progress`, `cdz-tooltip`, `cdz-divider`, `cdz-avatar`.
Más un primitivo (no-átomo):
`cdz-popover`, sobre el que se reconstruyó `cdz-select` (ver ADR-0010).
El sitio también tiene un toggle manual de light/dark (ver la enmienda de
ADR-0002).
Migrado a npm; `@kdenza/tokens` y `@kdenza/components` en `0.1.0`, listos
para publicar en el **registry público de npm** (ver la enmienda de
ADR-0006). El primer `npm publish` real sigue pendiente y necesita dos
cosas que solo se hacen desde una terminal propia: `npm login`, y
comprobar que el scope `@kdenza` esté libre en npmjs — si está tomado hay
que renombrar los paquetes antes de publicar, no después. Ver
`docs/publishing.md` y [README.md](README.md).
