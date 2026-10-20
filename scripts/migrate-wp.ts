/**
 * One-off migration of the old WordPress site, via its public REST API.
 *
 *   node scripts/migrate-wp.ts                 # migrate from https://scoutsvosselaar.be
 *   node scripts/migrate-wp.ts --dry-run       # only report what would happen
 *   node scripts/migrate-wp.ts --site <url>    # another WordPress origin
 *   node scripts/migrate-wp.ts --out <dir>     # write somewhere else than the repo
 *
 * Writes:
 * - posts:               src/content/posts/*.md, images in src/assets/uploads/posts/
 * - 't Voske:            src/content/voskes/*.json, PDFs in public/voske/
 * - group photos:        src/content/scout-years/<label>.json, images in src/assets/uploads/scout-years/
 * - PDFs of the group:   public/docs/
 * - old post URLs:       src/data/legacy-redirects.json
 * - report:              docs/huidige-site/migratie-rapport.md
 *
 * Existing files are never overwritten. Review the report and the diff before
 * committing: some things (like the call for donations in "Sanitaire blok")
 * have to be removed by hand.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import sharp from 'sharp';
import { stringify } from 'yaml';
import {
  MAX_GALLERY,
  convertPostHtml,
  decodeHtml,
  findImages,
  findLinks,
  fixText,
  imagePlaceholder,
  removeLeadingImage,
  scoutYearLabel,
  slugify,
  stripTags,
  truncate,
  wpDate,
  type FoundLink,
} from './migrate/convert.ts';

const args = process.argv.slice(2);
const option = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const DRY_RUN = args.includes('--dry-run');
const SITE = (option('--site') ?? 'https://scoutsvosselaar.be').replace(/\/$/, '');
const ROOT = option('--out') ?? join(import.meta.dirname, '..');

/** Posts that are not migrated (outdated), by slug prefix. */
const SKIP_POSTS = [/^corona/];
const MAX_GROUP_PHOTOS = 10;

interface WpPost {
  id: number;
  slug: string;
  date: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  _embedded?: { 'wp:featuredmedia'?: { source_url?: string }[] };
}

type WpPage = WpPost;

const report: string[] = [];
const warnings: string[] = [];
const written: string[] = [];

function warn(message: string) {
  warnings.push(message);
  console.warn(`! ${message}`);
}

async function fetchWithRetry(url: string, attempt = 1): Promise<Response> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'scoutsvosselaar-migratie' }, redirect: 'follow' });
    if (res.status >= 500 && attempt < 4) throw new Error(`HTTP ${res.status}`);
    return res;
  } catch (error) {
    if (attempt >= 4) throw error;
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    return fetchWithRetry(url, attempt + 1);
  }
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetchWithRetry(`${SITE}${path}`);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

async function getAll<T>(path: string): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; ; page++) {
    const sep = path.includes('?') ? '&' : '?';
    const res = await fetchWithRetry(`${SITE}${path}${sep}per_page=100&page=${page}`);
    if (res.status === 400 && page > 1) break;
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    const items = (await res.json()) as T[];
    all.push(...items);
    const pages = Number(res.headers.get('x-wp-totalpages') ?? '1');
    if (page >= pages) break;
  }
  return all;
}

function write(relativePath: string, content: string | Buffer) {
  const full = join(ROOT, relativePath);
  if (existsSync(full)) {
    warn(`Bestaat al, niet overschreven: ${relativePath}`);
    return;
  }
  written.push(relativePath);
  if (DRY_RUN) return;
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

const absolute = (url: string) => new URL(url, `${SITE}/`).href;

async function download(url: string): Promise<Buffer | undefined> {
  try {
    const res = await fetchWithRetry(absolute(url));
    if (!res.ok) {
      warn(`Download mislukt (HTTP ${res.status}): ${url}`);
      return undefined;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (error) {
    warn(`Download mislukt (${(error as Error).message}): ${url}`);
    return undefined;
  }
}

/** Downloads an image as webp, max 2000 px wide. sharp drops EXIF data unless asked to keep it. */
async function saveImage(url: string, relativePath: string): Promise<boolean> {
  const original = await download(url);
  if (!original) return false;
  try {
    const webp = await sharp(original).rotate().resize({ width: 2000, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    write(relativePath, webp);
    return true;
  } catch (error) {
    warn(`Geen geldige afbeelding (${(error as Error).message}): ${url}`);
    return false;
  }
}

/** Replaces http:// links by https:// when the https version answers. */
async function upgradeLinks(markdown: string): Promise<string> {
  const urls = [...new Set([...markdown.matchAll(/\]\((http:\/\/[^)\s]+)\)/g)].map((m) => m[1]!))];
  let result = markdown;
  for (const url of urls) {
    const secure = url.replace(/^http:/, 'https:');
    try {
      const res = await fetch(secure, { method: 'HEAD', redirect: 'follow' });
      if (res.ok) result = result.replaceAll(`](${url})`, `](${secure})`);
      else warn(`Link blijft http (https gaf HTTP ${res.status}): ${url}`);
    } catch {
      warn(`Link blijft http (https niet bereikbaar): ${url}`);
    }
  }
  return result;
}

async function migratePosts(): Promise<Record<string, string>> {
  const posts = await getAll<WpPost>('/wp-json/wp/v2/posts?_embed');
  report.push(`## Berichten\n\n${posts.length} berichten gevonden op de oude site.\n`);
  const redirects: Record<string, string> = {};

  for (const post of posts) {
    const title = fixText(decodeHtml(post.title.rendered).trim());
    if (SKIP_POSTS.some((re) => re.test(post.slug))) {
      report.push(`- Overgeslagen (verouderd): "${title}" (\`/${post.slug}/\`)`);
      redirects[`/${post.slug}/`] = '/';
      continue;
    }

    const date = wpDate(post.date);
    const id = `${date}-${slugify(post.slug) || slugify(title)}`;
    const converted = convertPostHtml(post.content.rendered);
    const imageDir = 'src/assets/uploads/posts';
    const imagePath = (n: number) => `${imageDir}/${id}-${n}.webp`;
    const relative = (path: string) => `../../${path.replace(/^src\//, '')}`;

    let counter = 1;
    let markdown = converted.markdown;
    const inline: (string | undefined)[] = [];
    for (const url of converted.inlineImages) {
      const path = imagePath(counter++);
      inline.push((await saveImage(url, path)) ? path : undefined);
    }

    let coverImage: string | undefined;
    const featured = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;
    if (featured) {
      const path = imagePath(counter++);
      if (await saveImage(featured, path)) coverImage = path;
    }
    if (!coverImage && inline[0]) {
      coverImage = inline[0];
      markdown = removeLeadingImage(markdown, 0);
    }

    for (const [i, path] of inline.entries()) {
      markdown = path
        ? markdown.replaceAll(imagePlaceholder(i), relative(path))
        : markdown.replace(new RegExp(`!\\[[^\\]]*\\]\\(${imagePlaceholder(i).replace(/[{}]/g, '\\$&')}\\)`, 'g'), '');
    }

    const gallery: string[] = [];
    for (const url of converted.galleryImages.slice(0, MAX_GALLERY)) {
      const path = imagePath(counter++);
      if (await saveImage(url, path)) gallery.push(path);
    }
    if (converted.galleryImages.length > MAX_GALLERY) {
      warn(`"${title}": ${converted.galleryImages.length} galerijfoto's, enkel de eerste ${MAX_GALLERY} overgenomen.`);
    }

    markdown = fixText(await upgradeLinks(markdown));
    const excerpt = truncate(fixText(stripTags(post.excerpt.rendered)) || stripTags(post.content.rendered));

    const data: Record<string, unknown> = { title, date, excerpt };
    if (coverImage) data.coverImage = relative(coverImage);
    if (gallery.length) data.gallery = gallery.map(relative);
    if (converted.videoUrl) data.videoUrl = converted.videoUrl;
    data.pinned = false;
    data.draft = false;

    write(`src/content/posts/${id}.md`, `---\n${stringify(data)}---\n\n${markdown}\n`);
    redirects[`/${post.slug}/`] = `/berichten/${id}/`;

    const notes = [
      `${inline.filter(Boolean).length} foto's in de tekst`,
      `${gallery.length} in de galerij`,
      coverImage ? 'met cover' : 'zonder cover',
      converted.videoUrl ? 'YouTube-video' : '',
      converted.droppedVideos.length ? `video weggelaten: ${converted.droppedVideos.join(', ')}` : '',
    ].filter(Boolean);
    report.push(`- "${title}" → \`src/content/posts/${id}.md\` (${notes.join(', ')})`);
    if (/gift|sponsor|steun/i.test(markdown)) {
      report.push(`  - **Nakijken:** bevat een oproep tot giften of steun. Volgens de spec weglaten.`);
    }
  }
  report.push('');
  return redirects;
}

const isOwnUpload = (href: string) => {
  try {
    const url = new URL(href, `${SITE}/`);
    // The old site is reachable with and without www.
    const bare = (host: string) => host.replace(/^www\./, '');
    return bare(url.host) === bare(new URL(SITE).host) && url.pathname.includes('/wp-content/uploads/');
  } catch {
    return false;
  }
};

async function migratePages() {
  const pages = await getAll<WpPage>('/wp-json/wp/v2/pages');
  report.push(`## Pagina's\n\n${pages.length} pagina's gevonden. Alle links per pagina, om de vaste pagina's aan te vullen:\n`);

  const pdfs = new Map<string, FoundLink & { page: string }>();
  for (const page of pages) {
    const title = decodeHtml(page.title.rendered).trim();
    const links = findLinks(page.content.rendered);
    report.push(`### ${title} (\`/${page.slug}/\`)\n`);
    if (links.length === 0) report.push('Geen links.\n');
    for (const link of links) {
      report.push(`- [${link.text || '(zonder tekst)'}](${link.href})`);
      if (/\.pdf(\?.*)?$/i.test(link.href) && isOwnUpload(link.href)) pdfs.set(link.href, { ...link, page: title });
      if (/\.(xlsx?|docx?)(\?.*)?$/i.test(link.href)) {
        report.push(`  - **Nakijken:** Office-bestand, niet gedownload (open vraag: publiek houden?).`);
      }
    }
    report.push('');
  }

  // 't Voske and other PDFs of the group.
  report.push(`## PDF's\n`);
  for (const [href, link] of pdfs) {
    const file = basename(new URL(href, `${SITE}/`).pathname);
    const isVoske = /voske/i.test(`${file} ${link.text} ${link.page}`);
    const year = /(20\d{2})/.exec(`${link.text} ${file}`)?.[1];
    const content = await download(href);
    if (!content) continue;

    if (isVoske && year) {
      const name = `t-voske-${year}.pdf`;
      write(`public/voske/${name}`, content);
      write(
        `src/content/voskes/t-voske-${year}.json`,
        `${JSON.stringify({ title: `'t Voske ${year}`, date: `${year}-01-01`, pdf: `/voske/${name}` }, null, 2)}\n`,
      );
      report.push(`- 't Voske ${year}: \`public/voske/${name}\` (datum op 1 januari gezet, nakijken)`);
    } else {
      const name = `${slugify(basename(file, extname(file)))}.pdf`;
      write(`public/docs/${name}`, content);
      report.push(`- ${link.text || file} (pagina "${link.page}"): \`public/docs/${name}\``);
    }
  }
  report.push('');

  // Group photo pages become scout years with only label, dates and photos.
  report.push(`## Groepsfoto's\n`);
  for (const page of pages) {
    const title = decodeHtml(page.title.rendered);
    const label = /groepsfoto/i.test(`${page.slug} ${title}`) ? scoutYearLabel(title) : undefined;
    if (!label) continue;
    const images = findImages(page.content.rendered);
    const photos: string[] = [];
    for (const [i, url] of images.slice(0, MAX_GROUP_PHOTOS).entries()) {
      const path = `src/assets/uploads/scout-years/groepsfoto-${label}-${i + 1}.webp`;
      if (await saveImage(url, path)) photos.push(`../../${path.replace(/^src\//, '')}`);
    }
    if (images.length > MAX_GROUP_PHOTOS) warn(`${title}: ${images.length} foto's, enkel de eerste ${MAX_GROUP_PHOTOS} overgenomen.`);
    const [start, end] = label.split('-');
    write(
      `src/content/scout-years/${label}.json`,
      `${JSON.stringify({ label, startDate: `${start}-09-01`, endDate: `${end}-08-31`, groupLeaders: [], sectionTeams: [], groupPhotos: photos }, null, 2)}\n`,
    );
    report.push(`- ${label}: ${photos.length} foto's`);
  }
  report.push('');
}

async function main() {
  console.log(`Migratie van ${SITE}${DRY_RUN ? ' (proefdraai, er wordt niets geschreven)' : ''}`);
  await getJson('/wp-json/');

  const redirects = await migratePosts();
  await migratePages();

  write('src/data/legacy-redirects.json', `${JSON.stringify(redirects, null, 2)}\n`);

  const text = [
    '# Migratierapport',
    '',
    `Gegenereerd door \`scripts/migrate-wp.ts\` op ${new Date().toISOString().slice(0, 10)} vanaf ${SITE}.`,
    '',
    ...report,
    '## Waarschuwingen',
    '',
    ...(warnings.length ? warnings.map((w) => `- ${w}`) : ['Geen.']),
    '',
    '## Geschreven bestanden',
    '',
    ...written.map((w) => `- \`${w}\``),
    '',
  ].join('\n');
  write('docs/huidige-site/migratie-rapport.md', text);
  if (DRY_RUN) console.log(`\n${text}`);
  console.log(`\n${written.length} bestanden${DRY_RUN ? ' (niet geschreven)' : ''}, ${warnings.length} waarschuwingen. Zie docs/huidige-site/migratie-rapport.md`);
}

await main();
