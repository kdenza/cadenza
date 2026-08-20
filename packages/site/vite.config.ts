import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Root is `src`, and the pages sit directly in it. They used to live in
// `src/pages/`, which made the build emit `dist/pages/index.html` -- fine
// locally, but on a static host the site's root URL then 404s, because
// there is no `dist/index.html`. Flattening is the fix, and it also drops
// the `/pages/` prefix from every URL.
export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'public'),
  // GitHub Pages serves a project site from `/<repo>/`, not from the
  // domain root, so every asset URL needs that prefix. Only in production:
  // the dev server does serve from `/`, and hardcoding the prefix there
  // would break local development instead.
  base: process.env.NODE_ENV === 'production' ? '/cadenza/' : '/',
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        designSystem: resolve(__dirname, 'src/design-system.html')
      }
    }
  },
  server: {
    port: 5173
  }
});
