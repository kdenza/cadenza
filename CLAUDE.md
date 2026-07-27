# Cadenza

Design system + portfolio de UX Engineering. El sitio es su propio caso de
estudio: tokens → componentes → sitio, construido con prácticas de equipo
enterprise.

## Stack y paquetes

Monorepo con pnpm workspaces. Node 18.19.1 — ver "Restricciones del
entorno" antes de tocar versiones de herramientas.

| Paquete | Qué es | Stack |
|---|---|---|
| `@cadenza/tokens` | Design tokens W3C DTCG → CSS custom properties (light + dark) | Style Dictionary 4.x |
| `@cadenza/components` | Web Components, prefijo `cdz-` | Lit 3 + TypeScript, sin decoradores |
| `@cadenza/gallery` | Visor de componentes con auditoría de accesibilidad en vivo | custom-elements-manifest + axe-core |
| `@cadenza/site` | Portafolio (consume los componentes) | Vite vanilla TS |

## Comandos

```bash
pnpm install
pnpm build      # tokens → components → analyze → site
pnpm dev        # sitio en modo desarrollo (puerto 5173)
pnpm gallery    # galería de componentes (puerto 5174)
pnpm test       # tests de componentes (@web/test-runner + axe-core)
```

## Convenciones

- Prefijo de componentes: `cdz-`. Scope de paquetes: `@cadenza/*`.
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
  `dist/`) — regenerar con `pnpm --filter @cadenza/components analyze`
  después de cambiar cualquier prop/evento de un componente.

## Restricciones del entorno

Node 18.19.1, no 20+/22+. Esto fijó varias versiones de herramientas por
debajo de su última mayor: pnpm 9.x, style-dictionary 4.x, vite 6.x,
`@web/test-runner` 0.20.x + `@web/test-runner-chrome` (no playwright, que
requiere Node ≥22). Revisar si el entorno ya tiene Node ≥20 antes de
actualizar cualquiera de estas — probablemente ya no haría falta fijarlas.

## Decisiones de arquitectura

Registro completo en [`docs/decisions/`](docs/decisions) (ADRs). Empezar
ahí antes de asumir el porqué de algo no obvio:

- **0001** — monorepo (pnpm) + Style Dictionary + Lit.
- **0002** — identidad visual (lila/rosa/azul), Figtree + Source Sans 3,
  tokens de doble modo (light/dark).
- **0003** — patrón de `cdz-input`; enmienda: enforcement de `label`
  obligatorio.
- **0004** — `@cadenza/gallery`: por qué custom-elements-manifest + axe-core
  en vez de Storybook/Histoire.
- **0005** — `cdz-checkbox`: `indeterminate` imperativo, cero tokens nuevos.

## Estado actual

3 átomos completos: `cdz-button`, `cdz-input`, `cdz-checkbox`. Ver
[README.md](README.md) para el estado general del proyecto.
