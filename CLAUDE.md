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
| `@kdenza/tokens` | Design tokens W3C DTCG → CSS custom properties (light + dark) | Style Dictionary 4.x | Sí, GitHub Packages |
| `@kdenza/components` | Web Components, prefijo `cdz-` | Lit 3 + TypeScript, sin decoradores | Sí, GitHub Packages |
| `@kdenza/gallery` | Visor de componentes con auditoría de accesibilidad en vivo | custom-elements-manifest + axe-core | No (privado) |
| `@kdenza/site` | Portafolio (consume los componentes) | Vite vanilla TS | No (privado) |

## Comandos

```bash
npm install
npm run build      # tokens → components → analyze → site
npm run dev        # sitio en modo desarrollo (puerto 5173)
npm run gallery    # galería de componentes (puerto 5174)
npm test           # tests de componentes (@web/test-runner + axe-core)
```

Para publicar una nueva versión o consumir los paquetes desde otro
proyecto, ver [docs/publishing.md](docs/publishing.md) — nunca pegar el
token de GitHub en una conversación con Claude, solo como variable de
entorno (`NODE_AUTH_TOKEN`) en tu propia terminal.

## Convenciones

- Prefijo de componentes: `cdz-`. Scope de paquetes: `@kdenza/*` (ligado a
  la organización `cadenza` en GitHub, no a la cuenta personal — ver
  ADR-0006).
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
  componente. El cambio de modo es `@import ... (prefers-color-scheme:
  dark)` — cero JavaScript.
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

Las versiones de herramientas siguen **fijadas por debajo de su última
mayor a propósito** (no por necesidad técnica ahora que hay Node 24):
style-dictionary 4.x, vite 6.x, `@web/test-runner` 0.20.x +
`@web/test-runner-chrome` (en vez de playwright). Esto fue una decisión
explícita para no re-verificar todo el pipeline de nuevo en la misma
sesión que se actualizó Node — subir estas versiones (y volver a validar
build/tests/dark-mode en cada paso) es trabajo pendiente, no una limitación
del entorno. `npm audit` ya marca 2 advisories reales ligadas a esto (ver
ADR-0006).

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
  en vez de Storybook/Histoire.
- **0005** — `cdz-checkbox`: `indeterminate` imperativo, cero tokens nuevos.
- **0006** — pnpm → npm, y publicar `@kdenza/tokens`/`@kdenza/components`
  vía GitHub Packages bajo la organización `cadenza`.

## Estado actual

3 átomos completos: `cdz-button`, `cdz-input`, `cdz-checkbox`. Migrado a
npm; `@kdenza/tokens` y `@kdenza/components` listos para publicarse en
`0.1.0` en cuanto exista la organización `cadenza` en GitHub (pendiente,
paso manual de la dueña del proyecto). Ver [README.md](README.md).
