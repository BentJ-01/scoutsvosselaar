import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Until the own domain is switched over, the site runs on GitHub Pages under
// /scoutsvosselaar/. Set SITE_URL and BASE_PATH in the deploy workflow to change.
const site = process.env.SITE_URL ?? 'https://bentj-01.github.io';
const base = process.env.BASE_PATH ?? '/scoutsvosselaar';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  vite: { plugins: [tailwindcss()] },
});
