import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { deployment } from './deployment.config';
import { sveltiaCms } from './src/cms/integration';

export default defineConfig({
  site: deployment.siteUrl,
  base: deployment.basePath,
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sveltiaCms(deployment)],
  vite: { plugins: [tailwindcss()] },
});
