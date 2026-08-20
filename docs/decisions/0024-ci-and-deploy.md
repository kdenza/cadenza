# ADR-0024: CI en GitHub Actions y despliegue a GitHub Pages

**Status:** Accepted
**Date:** 2026-08-20
**Deciders:** Cadenza design system owner (UX Engineer)

## Context

Hasta aquí, los 234 tests y `npm audit` corrían **cuando alguien se
acordaba**. ADR-0023 documenta el precio exacto de eso: la deuda de
dependencias creció de 2 a 9 advisories a lo largo de tres semanas sin que
nadie se enterara, y su propia sección "a revisar" señalaba que nada
impedía que volviera a pasar.

En paralelo, el sistema llevaba dos paquetes publicados en npm y **cero
URLs públicas**. Un design system que solo se ve clonando el repo no es
consumible ni demostrable.

## Decision

### CI: build, tests y auditoría en cada push y PR

Un solo job en `ubuntu-latest`, Node 24 (el mismo del entorno de
desarrollo). El paso que justifica el workflow no es el build ni los
tests, sino `npm audit --audit-level=high`: es el que convierte "deuda que
envejece en silencio" en "build roja el día que aparece".

**Chrome se localiza, no se hardcodea.** `@web/test-runner` necesita un
binario; `ubuntu-latest` lo trae, pero un paso previo lo busca entre
cuatro nombres posibles y falla con `::error::` si no encuentra ninguno.
Si una imagen futura lo mueve, el fallo es explícito ahí en vez de un
error sin contexto dentro del runner de tests.

Verificado en local todo lo verificable sin un runner: YAML válido, `npm
ci` desde `node_modules` borrado, build, tests con `CHROME_PATH` apuntando
al Chrome del sistema, y `npm audit --audit-level=high` saliendo con 0.

De paso se despejó un susto: `npm ci` avisa que el postinstall de esbuild
queda diferido por la política `allow-scripts` de npm 11. Resulta
inofensivo — el binario viene del paquete opcional `@esbuild/linux-x64`,
no del script. Comprobado borrando `node_modules` entero, no razonando
sobre ello.

### Despliegue: GitHub Pages

Gratis, ya vive donde vive el repo, y no añade una cuenta más que
mantener. Se publica **solo `packages/site/dist`**; `@kdenza/gallery`
sigue siendo privada y sin desplegar (ADR-0004).

### Lo que el despliegue destapó

Esta es la parte que vale la pena guardar. Preparar el deploy encontró
**tres cosas rotas que en local nunca fallaban**:

1. **Los 7 enlaces a ADRs del sitio ya estaban rotos.** Apuntaban a
   `../../../docs/decisions/*.md`, que sale de la raíz de Vite; daban 404
   *también en desarrollo*. Nadie lo notó porque nadie los había clicado.
   Ahora apuntan a las URLs de GitHub, que funcionan en los dos sitios, y
   usan `target="_blank"` — o sea el `rel="noopener"` y el aviso accesible
   que `cdz-link` ya traía para esto (ADR-0015).

2. **No existía `dist/index.html`.** Las páginas vivían en `src/pages/`,
   así que el build emitía `dist/pages/index.html` y la URL raíz de
   cualquier host estático habría dado 404. **ADR-0001 predijo esto
   textualmente** y dejó la decisión abierta "porque el hosting queda
   fuera de alcance". Se resolvió aplanando las páginas a `src/` en vez de
   añadir un rewrite: el prefijo `/pages/` no aportaba nada y costaba una
   redirección en cualquier destino.

3. **La demo de imagen rota pedía `/no-existe.png` con ruta absoluta**, que
   en Pages habría salido del proyecto hacia la raíz del dominio. Sigue
   dando 404 —que es el punto de la demo— pero ahora dentro de su propio
   espacio.

### `base` condicional, no fijo

GitHub Pages sirve un sitio de proyecto desde `/<repo>/`. Poner
`base: '/cadenza/'` a secas rompería el servidor de desarrollo, que sirve
desde `/`. Queda condicionado a `NODE_ENV === 'production'`, y el workflow
lo pone explícitamente.

Verificado **sirviendo el build bajo el subpath**, no solo compilándolo:
un servidor estático con `cadenza/` apuntando a `dist/` reproduce la forma
exacta de Pages. Las dos páginas, los assets y los enlaces internos
resuelven; cero errores de consola. Compilar sin errores no habría probado
nada de esto.

## Consequences

- **Más fácil:** hay una URL que poner en un CV, y cada push la actualiza
  sola.
- **Nuevo:** una build roja ahora bloquea la vista de que algo va mal, en
  vez de dejarlo pasar. Es el punto.
- **A revisar:** el deploy corre en el mismo push que CI pero no *depende*
  de él — GitHub Pages y CI son workflows separados. Si los tests fallan,
  el sitio se publica igual. Encadenarlos requiere `workflow_run`, que
  complica el disparo; se deja así a sabiendas mientras el repo tenga una
  sola persona.
- **A revisar:** la galería sigue sin desplegarse. Es el visor con la
  auditoría de accesibilidad en vivo, o sea justo lo que más demuestra el
  método — pero es un paquete privado con su propio servidor. Publicarla
  es una decisión aparte.

## Action Items

1. [x] `.github/workflows/ci.yml`: build + 234 tests + `npm audit
   --audit-level=high`, con localización defensiva de Chrome. Verificado
   desde un `node_modules` borrado.
2. [x] Reescritos los 7 enlaces a ADRs, rotos desde antes, a URLs de
   GitHub con `target="_blank"`.
3. [x] Páginas aplanadas de `src/pages/` a `src/`; cerrada la nota "to
   revisit" de ADR-0001.
4. [x] `base` condicional en `vite.config.ts` y verificación sirviendo el
   build bajo `/cadenza/` en un navegador real.
5. [x] `.github/workflows/deploy.yml` con los permisos mínimos de Pages y
   `concurrency` sin cancelación, para no dejar un deploy a medias.
