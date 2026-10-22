/**
 * Astro integration that builds the CMS into `public/admin/`.
 *
 * The admin page is a plain static file, not an Astro page: the dev server
 * reloads Astro pages whenever a file changes, which can interrupt saving in
 * Sveltia's local repository mode. So before the dev server or the build
 * starts, this bundles src/cms/admin.ts (with the configuration baked in)
 * next to public/admin/index.html. The npm package of Sveltia includes its
 * translations and fonts, so the admin loads nothing from a CDN.
 */
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { build } from 'vite';
import type { Deployment } from '../../deployment.config';
import { buildCmsConfig, buildEditorCss } from './config';

export function sveltiaCms(deployment: Deployment): AstroIntegration {
  return {
    name: 'sveltia-cms',
    hooks: {
      'astro:config:setup': async ({ config, logger }) => {
        const outDir = join(fileURLToPath(config.publicDir), 'admin', 'app');
        rmSync(outDir, { recursive: true, force: true });

        const started = Date.now();
        await build({
          configFile: false,
          logLevel: 'warn',
          publicDir: false,
          base: './',
          define: {
            __CMS_CONFIG__: JSON.stringify(buildCmsConfig(deployment)),
            __CMS_EDITOR_CSS__: JSON.stringify(buildEditorCss()),
          },
          build: {
            outDir,
            emptyOutDir: true,
            sourcemap: false,
            reportCompressedSize: false,
            chunkSizeWarningLimit: 10_000,
            lib: false,
            rollupOptions: {
              input: fileURLToPath(new URL('./admin.ts', import.meta.url)),
              output: {
                entryFileNames: 'admin.js',
                chunkFileNames: 'chunks/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]',
              },
            },
          },
        });
        logger.info(`CMS gebouwd in public/admin/app/ (${((Date.now() - started) / 1000).toFixed(1)}s)`);
      },
    },
  };
}
