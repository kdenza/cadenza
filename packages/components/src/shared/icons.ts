/**
 * The icon system's geometry rules, and the registry every Cadenza icon
 * is drawn into.
 *
 * ## The grid
 *
 * | Rule | Value | Why |
 * |---|---|---|
 * | Canvas | 24×24 | Enough room for detail that still reads when scaled down; the de-facto standard, so borrowed geometry drops in without re-scaling. |
 * | Live area | 20×20 (2 units of padding) | Nothing touches the edge, so icons of different shapes carry the same visual weight when set side by side. Bounds the **stroked** extent, not the path geometry: a stroke of 2 is centered on the path, so it adds 1 unit on every side. Measuring with `getBBox()` alone under-reports by exactly that much. |
 * | Stroke width | 2 | Constant *relative to the canvas* — this is the rule that was being broken before (see below). |
 * | Caps / joins | round | Matches the warm, non-technical personality from ADR-0002. |
 * | Corner radius | 2 | Only relevant where a path actually turns a corner; `stroke-linejoin` rounds the stroke's outer edge but does not create a radius in the geometry itself. |
 *
 * Optical balance beats arithmetic: a circle has to be slightly larger
 * than a square to *look* the same size, so "centered" here means
 * centered by eye, not by coordinate.
 *
 * ## Why this file exists
 *
 * The first three icons in this project were written inline, one per
 * component, months apart — and drifted, which is exactly what an icon
 * system exists to prevent. Measured before normalising:
 *
 * | Icon | Canvas | Stroke | Stroke ÷ canvas |
 * |---|---|---|---|
 * | chevron (`cdz-select`) | 12 | 1.5 | 12.5% |
 * | check (`cdz-checkbox`) | 16 | 2 | 12.5% |
 * | external-link (`cdz-link`) | 12 | 2 | **16.7%** |
 *
 * Two canvases, two stroke widths, and one icon a third heavier than the
 * others. Every icon now lives here instead, on one canvas, so that
 * comparison can't drift again — and this registry is what `cdz-icon`
 * will read from once it exists.
 */

/** Canvas every icon is drawn on. Also the `viewBox` every consumer renders. */
export const ICON_GRID = 24;

/** Constant across the whole set — see the table above. */
export const ICON_STROKE_WIDTH = 2;

export interface CdzIconDefinition {
  /**
   * SVG path `d` strings, painted in document order. Multiple entries are
   * separate strokes, not a compound path: keeping them apart lets a
   * consumer style or animate one part (the way `cdz-checkbox` shows
   * either its check or its dash).
   */
  paths: string[];
}

/**
 * Every icon in the system. Stroke-only by design — no `fill` — so a
 * single `currentColor` on the `<svg>` colours the whole icon and it
 * inherits from its context for free.
 */
export const icons = {
  /** Disclosure affordance for anything that expands downward. */
  'chevron-down': {
    paths: ['M6 9l6 6 6-6']
  },
  /**
   * Mirror of `chevron-down`, sharing its exact footprint (14×8 stroked)
   * so a control that flips direction doesn't visibly shift weight.
   */
  'chevron-up': {
    paths: ['M6 15l6-6 6 6']
  },
  /** Dismiss / close. */
  x: {
    paths: ['M6 6l12 12', 'M18 6l-12 12']
  },
  /** Affirmative mark: checked, done, succeeded. */
  check: {
    paths: ['M20 6L9 17l-5-5']
  },
  /** Partial / mixed state — deliberately not a "minus" in meaning. */
  dash: {
    paths: ['M5 12h14']
  },
  /*
   * The three status icons below are drawn as one family, not three
   * separate icons: same circle radius, same bar length, same dot
   * placement, same total content height (8→16). Only two things vary,
   * and both carry meaning:
   *
   * - The container says how loud it is. A circle is neutral;
   *   a triangle is the conventional "slow down" shape and reads more
   *   urgent even before the colour is applied.
   * - The mark says which kind. `info` is a lowercase "i" (dot on top,
   *   bar below); the two alerts are an exclamation mark (bar on top,
   *   dot below). Inverting that pair is what keeps `info` and
   *   `alert-circle` from being the same icon twice, since they share a
   *   container.
   *
   * The circles are radius 9, so their stroked outer edge lands exactly
   * on the 20×20 live area. Worth noting that Lucide and Feather both
   * use radius 10 here, which puts their stroke a unit outside a live
   * area this size — not a mistake on their part, just a looser system.
   * Matching the rule this project already declared matters more than
   * matching theirs.
   *
   * Dots are zero-length segments (`h.01`) rendered as circles by
   * `stroke-linecap: round` — the standard trick, and it keeps the dot's
   * diameter tied to the stroke width automatically.
   *
   * ## Known limit: `info` and `alert-circle` collapse at `size="sm"`
   *
   * They share a container and differ only by which end of the mark
   * carries the dot. That difference spans about 3 grid units, which at
   * 16px is roughly 2 real pixels — under what a 1.33px stroke can
   * express. Verified by rendering the pair alternating at 16px: they are
   * not reliably tellable apart. Three redraws were tried (longer bar,
   * wider dot/bar gap, larger gap with a shorter bar) and none of them
   * changed the outcome, which is what makes this a limit rather than a
   * drawing problem. At `md` (20px) and above the pair reads correctly.
   *
   * So: **use `md` or larger whenever these two need to be distinguished
   * from each other by shape.** In practice the components that will use
   * them (badge, alert) always pair the icon with text, which is why
   * `cdz-icon` treats icons as decorative by default — the icon supports
   * the message rather than carrying it. Colour differs between the two
   * as well, but that is a second cue, never the only one (WCAG 1.4.1).
   */

  /** Neutral, explanatory. Not a problem. */
  info: {
    paths: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18', 'M12 11v5', 'M12 8h.01']
  },
  /** Something is wrong and needs attention. */
  'alert-circle': {
    paths: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18', 'M12 8v5', 'M12 16h.01']
  },
  /**
   * Higher urgency than `alert-circle`. The apex deliberately keeps its
   * point instead of taking the system's corner radius of 2: rounding an
   * acute angle by 2 units flattens it enough to read as a blob rather
   * than a warning triangle. `stroke-linejoin: round` still softens it,
   * which is enough. The corner-radius rule applies to rectangular
   * forms.
   */
  'alert-triangle': {
    paths: ['M12 4L21 20H3Z', 'M12 10v4', 'M12 17h.01']
  },

  /**
   * Signals that activating something leaves the current context.
   *
   * The most complex icon in the set, and the one that needed hand
   * correction: an enclosed box reads heavier than an open stroke even at
   * identical bounds, so drawn at the same extent as the others it looked
   * oversized next to them. Pulled in one unit on the top and right so
   * its *stroked* extent (3→21 horizontally, 3→20 vertically) sits inside
   * the live area with the same breathing room the check has, instead of
   * touching it.
   */
  'external-link': {
    paths: [
      // Container, deliberately open at the top-right so the arrow reads
      // as leaving it. Corners use radius 2 (see the grid rules).
      'M12 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5',
      // Arrow head.
      'M15 4h5v5',
      // Shaft, aimed back into the container's open corner.
      'M20 4l-8 8'
    ]
  },

  /**
   * Generic stand-in for a person, drawn for `cdz-avatar`'s icon
   * fallback. Head and shoulders as two separate strokes rather than one
   * outline: at 24px an outline of a bust turns into a blob, whereas two
   * marks with a gap between them still read as a figure.
   *
   * Stroked extent 3→21 horizontally, 2→22 vertically — the full height
   * of the live area, but 18 wide rather than 20. That asymmetry is on
   * purpose: a person reads taller than wide, and forcing the shoulders
   * out to the full 20 would make this the visually heaviest icon in the
   * set.
   *
   * Measured by hand, not with `getBBox({ stroke: true })` — Chromium
   * accepts that option and silently ignores it (a 2-unit stroke on a
   * straight line still reports zero height). See ADR-0022.
   */
  user: {
    paths: [
      // Head. Two half-arcs rather than a <circle>, because the registry
      // stores paths only.
      'M12 3a4 4 0 0 0 0 8 4 4 0 0 0 0-8',
      // Shoulders. Corners use radius 4 here, not the usual 2 — this is a
      // body, not a container, so the softer curve is doing different work.
      'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'
    ]
  }
} satisfies Record<string, CdzIconDefinition>;

export type CdzIconName = keyof typeof icons;
