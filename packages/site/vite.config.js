import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Root is `src`, not `src/pages`: pages reference `../main.ts` and
// `../styles/global.css` as siblings one level up. A relative <script> or
// <link> can't resolve above the configured Vite root (the browser clamps
// it), so `main.ts` has to live inside the root too — `src` is the smallest
// root that contains both `pages/` and `main.ts`. Dev/build URLs therefore
// carry a `/pages/` prefix (e.g. /pages/index.html).
export default defineConfig({
  root: resolve(__dirname, 'src'),
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/pages/index.html'),
        designSystem: resolve(__dirname, 'src/pages/design-system.html')
      }
    }
  },
  server: {
    port: 5173,
    open: '/pages/index.html'
  }
});
