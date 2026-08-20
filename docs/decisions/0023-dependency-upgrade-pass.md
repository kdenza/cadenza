# ADR-0023: Subir todas las herramientas y cerrar los 9 advisories

**Status:** Accepted
**Date:** 2026-08-20
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

ADR-0006 dejó las versiones de herramientas **fijadas por debajo de su
última mayor a propósito**, para no re-verificar todo el pipeline en la
misma sesión en que se había actualizado Node. Decía que `npm audit`
marcaba "2 advisories reales ligadas a esto".

Al retomarlo, eran **9** (8 high, 1 low). Ese es el hallazgo que importa
más que cualquier número de versión: una deuda de dependencias no se queda
quieta, y la nota que la documentaba envejeció en silencio durante tres
semanas mientras se construían doce átomos encima.

El momento se eligió a propósito: **antes** de escribir el caso de estudio
del portafolio. Subir versiones después habría mezclado cada regresión con
contenido nuevo, y separar las dos causas cuesta mucho más que hacerlo con
el sistema estable y en verde.

## Decision

Subir todo, de uno en uno, verificando build + los 234 tests entre cada
paso, y comparando artefactos generados contra una línea base en vez de
confiar en que "compila".

| Paquete | De | A | Por qué |
|---|---|---|---|
| style-dictionary | 4.4.0 | 5.5.2 | **Prototype pollution** (high) en `convertTokenData` |
| `@web/test-runner` | 0.20.2 | 1.0.0 | Raíz de 5 advisories encadenados |
| `@web/test-runner-chrome` | 0.18.1 | 1.0.1 | ídem (puppeteer-core → @puppeteer/browsers → extract-zip) |
| `@web/dev-server-esbuild` | 1.0.5 | 2.0.0 | acompaña al runner |
| vite | 6.4.3 | 8.2.2 | dos mayores de rezago |
| TypeScript | 5.9.3 | 7.0.2 | compilador nuevo |
| axe-core | 4.12.1 | 4.13.0 | menor |

Resultado: **0 vulnerabilidades**, 234/234, y los tests bajaron de ~3.9s a
~2.8s.

### Comparar artefactos, no confiar en que compila

Dos saltos de mayor tocaban generación de código, así que en ambos se
guardó una línea base antes y se comparó byte a byte después:

- **style-dictionary 5.x**: los cuatro CSS de tema salieron **idénticos**,
  sin tocar el config. El salto de mayor no rompió nada de lo que este
  proyecto usa.
- **TypeScript 7**: los 41 `.js` emitidos salieron **idénticos** a los de
  5.9. Esto era lo único que de verdad daba miedo del salto: el patrón sin
  decoradores de Lit depende de `useDefineForClassFields: false` para que
  los campos se emitan como asignaciones en el constructor y no como
  `Object.defineProperty`, que pisaría los accesores de Lit y rompería la
  reactividad **en silencio**. Un diff idéntico es prueba de que eso no
  cambió; "compiló sin errores" no lo habría sido.

### Vite 8 dejó de quedar hoisted

Efecto secundario real: con vite 8 npm ya no lo sube a la raíz del
workspace, así que `node_modules/.bin/vite` desapareció y todo lo que
apuntara ahí quedó roto (en este caso, la config de arranque de los
servidores de desarrollo). Corregido a
`packages/<pkg>/node_modules/.bin/vite`.

Es el tipo de rotura que un `npm run build` verde no detecta, porque solo
afecta al arranque en desarrollo.

## Consequences

- **Más fácil:** la nota de "versiones fijadas a propósito" desaparece.
  Ya no hay que explicar por qué el proyecto va por detrás.
- **Nuevo riesgo asumido:** TypeScript 7 es muy reciente. La mitigación no
  es esperanza, es el diff byte a byte: si una versión futura cambia la
  emisión, la comparación contra la línea base lo detecta. Vale repetir
  ese chequeo en el próximo salto de TS.
- **A revisar:** no hay nada que impida que esto vuelva a envejecer tres
  semanas. Un `npm audit` en CI lo haría visible el día que aparezca, en
  vez del día que alguien se acuerde de mirar — pero CI todavía no existe.

## Action Items

1. [x] `npm audit fix` no-mayor (brace-expansion, nanoid, esbuild) y
   axe-core 4.13; 9 → 7 advisories, CSS de tokens idéntico.
2. [x] style-dictionary 5.5.2; cierra el prototype pollution, salida
   idéntica byte a byte, 9 → 6.
3. [x] Cadena `@web/test-runner` a 1.x; **0 advisories**. Verificada la
   estabilidad del runner con 6 corridas encadenadas tras build.
4. [x] vite 8.2.2 verificado en navegador (10/10 custom elements, tokens
   activos) y corregida la ruta del binario en la config de arranque.
5. [x] TypeScript 7.0.2 en los tres paquetes, con los 41 `.js` comparados
   contra la línea base de 5.9.
6. [x] Actualizada la sección "Restricciones del entorno" de CLAUDE.md,
   que seguía describiendo el estado de julio.
