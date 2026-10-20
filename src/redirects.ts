/**
 * Redirects from URLs of the old WordPress site. GitHub Pages has no server
 * redirects, so Astro writes a small redirect page for each of these. URL
 * patterns that cannot be listed (e.g. /event/...) are handled by the script
 * in src/pages/404.astro.
 *
 * The old pages are listed in docs/huidige-site/migratie-rapport.md (and inhoud.md, §1).
 */
import { existsSync, readFileSync } from 'node:fs';
import { deployment } from '../deployment.config';

/** Fixed pages of the old site. */
const fixed: Record<string, string> = {
  '/informatie/': '/praktisch/',
  '/lidworden/': '/inschrijven/',
  '/t-voske/': '/voske/',
  '/voskes/': '/voske/',
  '/lokalenverhuur/': '/verhuur/',
  '/corona-upd/': '/',
  // Old section pages.
  '/kapoenen/': '/takken/kapoenen/',
  '/welpen/': '/takken/welpen/',
  '/wolven/': '/takken/wolven/',
  '/jongverkenners/': '/takken/jongverkenners/',
  '/verkenners/': '/takken/verkenners/',
  '/jin/': '/takken/jin/',
  '/akabe/': '/takken/akabe/',
  // Old photo pages that the 404 patterns do not cover.
  '/kapoenenkamp-2022/': '/fotos/',
  '/welpenkamp-essen-2022/': '/fotos/',
  '/jong-verkennerkamp-herbeumont-2022/': '/fotos/',
  '/akabekamp-2022/': '/fotos/',
};

/** Old post URLs (/<slug>/ → /berichten/<id>/), written by scripts/migrate-wp.ts. */
function migratedPosts(): Record<string, string> {
  const file = new URL('./data/legacy-redirects.json', import.meta.url);
  if (!existsSync(file)) return {};
  return JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>;
}

const base = deployment.basePath.replace(/\/$/, '');

/** For astro.config.ts. Astro does not add the base path to the destinations itself. */
export const redirects: Record<string, string> = Object.fromEntries(
  Object.entries({ ...migratedPosts(), ...fixed }).map(([from, to]) => [from, `${base}${to}`]),
);

/** Patterns for the 404 page: old URLs starting with these go to the given page. */
export const redirectPatterns: [prefix: string, target: string][] = [
  ['/event/', '/kalender/'],
  ['/events/', '/kalender/'],
  ['/fotos-', '/fotos/'],
  ['/groepsfotos', '/fotos/'],
  ['/kamp', '/fotos/'],
];
