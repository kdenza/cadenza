# Cadenza

Design system + portfolio de UX Engineering. El sitio es el caso de estudio: un
design system real (tokens → componentes → sitio) construido con prácticas de
equipo enterprise.

## Paquetes

| Paquete | Descripción |
|---|---|
| [`@cadenza/tokens`](packages/tokens) | Design tokens (W3C DTCG) vía Style Dictionary → CSS custom properties (light + dark) |
| [`@cadenza/components`](packages/components) | Web Components (Lit + TypeScript), prefijo `cdz-` |
| [`@cadenza/gallery`](packages/gallery) | Visor de componentes generado desde `custom-elements.json`, con auditoría de accesibilidad en vivo (axe-core) |
| [`@cadenza/site`](packages/site) | Sitio del portafolio (Vite), consume los componentes |

## Uso

```bash
pnpm install
pnpm build      # tokens → components → analyze → site
pnpm dev        # levanta el sitio en modo desarrollo
pnpm gallery    # levanta la galería de componentes
pnpm test       # tests de componentes (@web/test-runner)
```

## Estado

Tres átomos (`<cdz-button>`, `<cdz-input>`, `<cdz-checkbox>`) validando la
arquitectura de tokens en tres capas (global → semántica → componente) y
el patrón de documentación/ARIA por componente. Ver
[docs/decisions](docs/decisions) para el registro de decisiones de
arquitectura.
