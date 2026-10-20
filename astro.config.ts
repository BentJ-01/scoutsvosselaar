import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { deployment } from './deployment.config';
import sitemap from '@astrojs/sitemap';
import { sveltiaCms } from './src/cms/integration';
import { redirects } from './src/redirects';

export default defineConfig({
  site: deployment.siteUrl,
  base: deployment.basePath,
  trailingSlash: 'always',
  build: { format: 'directory' },
  redirects,
  integrations: [sveltiaCms(deployment), sitemap({ filter: (page) => !page.includes('/admin/') })],
  vite: { plugins: [tailwindcss()] },
});
