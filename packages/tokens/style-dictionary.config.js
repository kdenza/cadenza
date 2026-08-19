import StyleDictionary from 'style-dictionary';

// Global + component tokens are mode-stable and shared by all builds;
// only the semantic color file differs per mode. Each mode gets its own
// complete, independently-resolved CSS file (every declares every custom
// property, not just the ones that differ).
//
// Four builds, not two, to support both automatic (OS-preference) and
// manual (user toggle) theming without JS for the common case:
//   - tokens-light.css / tokens-dark.css: plain `:root` selector, picked
//     up via a `prefers-color-scheme`-conditioned @import — zero JS for
//     anyone who never touches a toggle.
//   - tokens-dark-forced.css / tokens-light-forced.css:
//     `[data-theme="dark"]` / `[data-theme="light"]` selectors. A plain
//     attribute selector on `:root` has higher CSS specificity than a
//     bare `:root` (even one wrapped in a media query — media queries
//     don't add specificity), so setting `data-theme` on `<html>` wins
//     over the OS preference regardless of which one the browser
//     currently prefers. See ADR-0002's amendment for the toggle button
//     that sets this attribute.
const sharedSource = [
  'src/global/**/*.tokens.json',
  'src/semantic/typography.tokens.json',
  'src/semantic/elevation.tokens.json',
  'src/component/**/*.tokens.json'
];

const themes = [
  { colorSource: 'src/semantic/color.light.tokens.json', destination: 'tokens-light.css' },
  { colorSource: 'src/semantic/color.dark.tokens.json', destination: 'tokens-dark.css' },
  {
    colorSource: 'src/semantic/color.dark.tokens.json',
    destination: 'tokens-dark-forced.css',
    selector: '[data-theme="dark"]'
  },
  {
    colorSource: 'src/semantic/color.light.tokens.json',
    destination: 'tokens-light-forced.css',
    selector: '[data-theme="light"]'
  }
];

for (const theme of themes) {
  const sd = new StyleDictionary({
    source: [...sharedSource, theme.colorSource],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: 'dist/css/',
        files: [
          {
            destination: theme.destination,
            format: 'css/variables',
            options: {
              outputReferences: true,
              selector: theme.selector
            }
          }
        ]
      }
    }
  });

  // eslint-disable-next-line no-await-in-loop
  await sd.buildAllPlatforms();
}
