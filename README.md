# Cadenza

Design system + portfolio de UX Engineering. El sitio es el caso de estudio: un
design system real (tokens → componentes → sitio) construido con prácticas de
equipo enterprise.

## Paquetes

| Paquete | Descripción | Publicado |
|---|---|---|
| [`@kdenza/tokens`](packages/tokens) | Design tokens (W3C DTCG) vía Style Dictionary → CSS custom properties (light + dark) | npm público |
| [`@kdenza/components`](packages/components) | Web Components (Lit + TypeScript), prefijo `cdz-` | npm público |
| [`@kdenza/gallery`](packages/gallery) | Visor de componentes generado desde `custom-elements.json`, con auditoría de accesibilidad en vivo (axe-core) | Privado |
| [`@kdenza/site`](packages/site) | Sitio del portafolio (Vite), consume los componentes | Privado |

## Uso

```bash
npm install
npm run build      # tokens → components → analyze → site
npm run dev        # levanta el sitio en modo desarrollo
npm run gallery     # levanta la galería de componentes
npm test            # tests de componentes (@web/test-runner)
```

Para publicar una versión nueva o consumir `@kdenza/components` desde
otro proyecto, ver [docs/publishing.md](docs/publishing.md).

## Estado

Dieciocho átomos, con las cinco categorías cerradas — formularios,
texto y navegación, feedback, medios y estructura — (`<cdz-button>`,
`<cdz-input>`, `<cdz-checkbox>`, `<cdz-radio>`, `<cdz-text>`,
`<cdz-select>`, `<cdz-textarea>`, `<cdz-switch>`, `<cdz-range>`,
`<cdz-file-input>`, `<cdz-link>`, `<cdz-icon>`, `<cdz-badge>`,
`<cdz-spinner>`, `<cdz-progress>`, `<cdz-tooltip>`, `<cdz-divider>`,
`<cdz-avatar>`) validando la arquitectura de
tokens en tres capas (global → semántica → componente) y el patrón de
documentación/ARIA por componente. Además, un primitivo reusable
(`<cdz-popover>`, no es un átomo) sobre el que se reconstruyó
`<cdz-select>` para resolver la limitación de estilo del popup nativo —
ver [ADR-0010](docs/decisions/0010-popover-primitive-and-select-rebuild.md).
Migrado de pnpm a npm; `@kdenza/tokens` y `@kdenza/components` en `0.1.0`,
listos para su primera publicación en el registry público de npm
(pendiente de un entorno con terminal propia, y de registrar el scope
`@kdenza` en npmjs). Ver [docs/roadmap.md](docs/roadmap.md) para
el checklist completo —lo que sigue son moléculas— y
[docs/decisions](docs/decisions) para el registro de decisiones de
arquitectura.
