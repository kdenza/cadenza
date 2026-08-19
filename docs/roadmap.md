# Roadmap de átomos

Checklist de controles HTML básicos que Cadenza busca cubrir, organizados
por categoría. Actualizar esta lista al terminar cada átomo (no al
empezarlo) — es un registro de lo que existe, no un plan de sprint. También
trackea la sección "Primitivos" (building blocks internos, no átomos) y
"Después de los átomos" (moléculas), con el mismo criterio.

**Las cinco categorías de átomos están cerradas** (18 átomos + 1
primitivo). Lo que sigue son moléculas — ver el final de este archivo.

No incluye Heading/Paragraph como items separados: `cdz-text` (ver
[ADR-0008](decisions/0008-text-component.md)) ya cubre ambos con una sola
API (`as` + `size`), no hace falta un componente por tag.

## Formularios

- [x] Button — [ADR-0001](decisions/0001-monorepo-tokens-lit.md)
- [x] Input (texto) — [ADR-0003](decisions/0003-input-component.md)
- [x] Checkbox — [ADR-0005](decisions/0005-checkbox-component.md)
- [x] Radio — [ADR-0007](decisions/0007-radio-component.md)
- [x] Select (dropdown) — [ADR-0009](decisions/0009-select-component.md),
      reconstruido en [ADR-0010](decisions/0010-popover-primitive-and-select-rebuild.md)
- [x] Textarea — [ADR-0011](decisions/0011-textarea-component.md)
- [x] Switch / toggle — [ADR-0012](decisions/0012-switch-component.md)
- [x] Range (slider) — [ADR-0013](decisions/0013-range-component.md)
- [x] File input — [ADR-0014](decisions/0014-file-input-component.md)

## Contenido / tipografía

- [x] Text (heading + párrafo unificado) — [ADR-0008](decisions/0008-text-component.md)

## Texto y navegación

- [x] Link — [ADR-0015](decisions/0015-link-component.md)

## Feedback y estado

- [x] Badge / tag — [ADR-0017](decisions/0017-badge-status-palette.md).
      Trajo la paleta de estado (`color.status.*`), reusable por
      cualquier componente que necesite semántica de estado.
- [x] Spinner / loading — [ADR-0018](decisions/0018-spinner-component.md).
      Primero con live region (contrasta con badge) y primero con
      animación, o sea el primero que resuelve `prefers-reduced-motion`.
- [x] Progress bar — [ADR-0019](decisions/0019-progress-component.md).
      Solo determinado; el indeterminado es `cdz-spinner`.
- [x] Tooltip — [ADR-0020](decisions/0020-tooltip-component.md). Era, en
      efecto, el más difícil: obligó a descubrir que el shadow DOM bloquea
      tanto las referencias ARIA por id como el anclaje CSS por
      `anchor-name`, ambos por ser *tree-scoped*.

## Medios

- [x] Icon (wrapper) — [ADR-0016](decisions/0016-icon-system-grid.md).
      Set actual: 10 íconos (`chevron-down`, `chevron-up`, `x`, `check`,
      `dash`, `info`, `alert-circle`, `alert-triangle`, `external-link`,
      `user`). Se agregan al registro a medida que hagan falta; auditar siempre en
      el contact sheet de la galería antes de darlos por buenos.
- [x] Avatar — [ADR-0022](decisions/0022-avatar-component.md). Foto →
      iniciales → ícono genérico, y las dos últimas son hermanas, no una
      degradada de la otra. **Significativo por defecto**, rompiendo a
      propósito la regla de ADR-0021: el default es callado cuando la
      opción ruidosa tendría que adivinarse, y ruidoso cuando la cadena
      correcta ya está en la mano. Sin color derivado del nombre (un hash
      no puede prometer contraste).

## Estructura

- [x] Divider — [ADR-0021](decisions/0021-divider-component.md).
      Decorativo por defecto (`role="none"`), semántico solo si se pide:
      la mayoría de las líneas de una interfaz son mobiliario visual, no
      cortes temáticos. Mismo default que `cdz-icon` por la razón
      contraria — ahí el riesgo grave es el silencio, aquí el ruido.

## Primitivos

No son átomos: no son piezas de UI que se usan solas, son building blocks
que otros componentes consumen por dentro. Se documentan y versionan
igual que un átomo (tokens/API → implementación → ADR), pero viven en su
propia categoría porque no tienen lugar en la jerarquía de Atomic Design.

- [x] Popover (`cdz-popover`) — panel flotante genérico (trigger + panel
      posicionado con `popover` + anchor positioning), con el patrón ARIA
      completo reimplementado a mano (no delega en el `<select>` nativo).
      Primer consumidor: reemplaza el popup nativo no restyleable de
      `cdz-select` — ver [ADR-0010](decisions/0010-popover-primitive-and-select-rebuild.md)
      (la limitación original quedó documentada en
      [ADR-0009](decisions/0009-select-component.md)).
      Pensado para reusarse en futuros menús/comboboxes.

## Después de los átomos

Moléculas ya identificadas mientras se construían los átomos, todavía sin
empezar:

- `cdz-radio-group` — coordina varios `cdz-radio` (exclusión mutua, roving
  tabindex, `required` a nivel de grupo) — ver el límite documentado en
  [ADR-0007](decisions/0007-radio-component.md).
