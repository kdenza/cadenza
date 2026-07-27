import StyleDictionary from 'style-dictionary';

// Global + component tokens are mode-stable and shared by both builds;
// only the semantic color file differs per mode. Each mode gets its own
// complete, independently-resolved CSS file (both declare every custom
// property, not just the ones that differ) — the component/site layer
// picks which one applies via a `prefers-color-scheme`-conditioned
// @import, so no JS is needed to switch themes. See ADR-0002.
const sharedSource = [
  'src/global/**/*.tokens.json',
  'src/semantic/typography.tokens.json',
  'src/component/**/*.tokens.json'
];

const themes = [
  { colorSource: 'src/semantic/color.light.tokens.json', destination: 'tokens-light.css' },
  { colorSource: 'src/semantic/color.dark.tokens.json', destination: 'tokens-dark.css' }
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
              outputReferences: true
            }
          }
        ]
      }
    }
  });

  // eslint-disable-next-line no-await-in-loop
  await sd.buildAllPlatforms();
}
