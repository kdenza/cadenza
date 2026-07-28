# Cadenza

Design system + portfolio de UX Engineering. El sitio es el caso de estudio: un
design system real (tokens → componentes → sitio) construido con prácticas de
equipo enterprise.

## Paquetes

| Paquete | Descripción | Publicado |
|---|---|---|
| [`@kdenza/tokens`](packages/tokens) | Design tokens (W3C DTCG) vía Style Dictionary → CSS custom properties (light + dark) | GitHub Packages |
| [`@kdenza/components`](packages/components) | Web Components (Lit + TypeScript), prefijo `cdz-` | GitHub Packages |
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

Cuatro átomos (`<cdz-button>`, `<cdz-input>`, `<cdz-checkbox>`,
`<cdz-radio>`) validando la arquitectura de tokens en tres capas (global →
semántica → componente) y el patrón de documentación/ARIA por componente.
Migrado de pnpm a npm; `@kdenza/tokens` y `@kdenza/components` en `0.1.0`,
listos para su primera publicación en GitHub Packages (pendiente de un
entorno con terminal propia). Ver [docs/decisions](docs/decisions) para
el registro de decisiones de arquitectura.
