import { chromeLauncher } from '@web/test-runner-chrome';
import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  nodeResolve: true,
  files: 'src/**/*.test.ts',
  plugins: [esbuildPlugin({ ts: true, target: 'es2021' })],
  browsers: [
    chromeLauncher({
      launchOptions: {
        headless: true,
        // Sandboxed/containerized Linux hosts usually lack the user
        // namespace permissions Chrome's own sandbox needs; without these
        // flags the browser fails to launch at all in that environment.
        args: ['--no-sandbox', '--disable-dev-shm-usage']
      }
    })
  ]
};
