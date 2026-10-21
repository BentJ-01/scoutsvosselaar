/**
 * Astro integration that turns each PDF of 't Voske into page images, for the
 * flip-book reader on /voske/<edition>/.
 *
 * Runs before the dev server and the build. For public/voske/<name>.pdf it
 * writes public/voske/pagina/<name>/NNN.webp and a manifest.json. A PDF that
 * did not change (same hash) is skipped. Needs `pdftoppm` (poppler-utils);
 * without it, the reader is left out and "Lezen" opens the PDF.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import sharp from 'sharp';

/** Width of the page images in pixels. Enough for a sharp two-page spread. */
const PAGE_WIDTH = 1000;
const RENDER_DPI = 130;

export interface VoskeManifest {
  hash: string;
  pages: number;
  width: number;
  height: number;
}

function hasPdftoppm(): boolean {
  try {
    execFileSync('pdftoppm', ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function renderPdf(pdf: string, outDir: string, hash: string): Promise<VoskeManifest> {
  const tmp = mkdtempSync(join(tmpdir(), 'voske-'));
  try {
    execFileSync('pdftoppm', ['-r', String(RENDER_DPI), '-png', pdf, join(tmp, 'p')]);
    const pngs = readdirSync(tmp).filter((f) => f.endsWith('.png')).sort();
    rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    let size = { width: PAGE_WIDTH, height: Math.round(PAGE_WIDTH * 1.414) };
    for (const [i, png] of pngs.entries()) {
      const info = await sharp(join(tmp, png))
        .resize({ width: PAGE_WIDTH, withoutEnlargement: true })
        .webp({ quality: 74 })
        .toFile(join(outDir, `${String(i + 1).padStart(3, '0')}.webp`));
      if (i === 0) size = { width: info.width, height: info.height };
    }
    const manifest = { hash, pages: pngs.length, ...size };
    writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    return manifest;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

export function voskePages(): AstroIntegration {
  return {
    name: 'voske-pages',
    hooks: {
      'astro:config:setup': async ({ config, logger }) => {
        const voskeDir = join(fileURLToPath(config.publicDir), 'voske');
        if (!existsSync(voskeDir)) return;
        const pdfs = readdirSync(voskeDir).filter((f) => f.toLowerCase().endsWith('.pdf'));
        if (pdfs.length === 0) return;
        if (!hasPdftoppm()) {
          logger.warn("pdftoppm ontbreekt: geen bladerbare versie van 't Voske, 'Lezen' opent de PDF.");
          return;
        }
        for (const file of pdfs) {
          const pdf = join(voskeDir, file);
          const hash = createHash('sha256').update(readFileSync(pdf)).digest('hex').slice(0, 16);
          const outDir = join(voskeDir, 'pagina', basename(file, '.pdf'));
          const manifestPath = join(outDir, 'manifest.json');
          if (existsSync(manifestPath) && (JSON.parse(readFileSync(manifestPath, 'utf8')) as VoskeManifest).hash === hash) continue;
          const started = Date.now();
          const manifest = await renderPdf(pdf, outDir, hash);
          logger.info(`${file}: ${manifest.pages} pagina's omgezet (${((Date.now() - started) / 1000).toFixed(1)}s)`);
        }
      },
    },
  };
}

/** The manifest of an edition, if its pages were rendered. `pdf` is the public path, e.g. /voske/t-voske-2024.pdf. */
export function readVoskeManifest(publicDir: string, pdf: string): VoskeManifest | undefined {
  const name = basename(pdf, '.pdf');
  const path = join(publicDir, 'voske', 'pagina', name, 'manifest.json');
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as VoskeManifest) : undefined;
}
