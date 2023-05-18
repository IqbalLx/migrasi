import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/kit/vite';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter({ out: 'dist/packages/web' }),
    files: {
      appTemplate: 'packages/web/src/app.html',
      routes: 'packages/web/src/routes',
      assets: 'packages/web/static',
      lib: 'packages/web/src/lib',
      serviceWorker: 'packages/web/src/service-worker',
      hooks: {
        client: 'packages/web/src/hooks.client',
        server: 'packages/web/src/hooks.server',
      },
      lib: 'packages/web/src/lib',
    },
    outDir: '.svelte-kit',
  },
};

export default config;
