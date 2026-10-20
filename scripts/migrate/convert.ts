/**
 * Pure helpers for the one-off WordPress migration (scripts/migrate-wp.ts).
 * No network or file access here, so they can be unit tested.
 */
import TurndownService from 'turndown';

export const MAX_EXCERPT = 200;
export const MAX_GALLERY = 12;
export const VIDEO_UNAVAILABLE = '*De video bij dit bericht is niet meer beschikbaar.*';

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '–',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', euro: '€', eacute: 'é', egrave: 'è',
  euml: 'ë', ecirc: 'ê', iuml: 'ï', ouml: 'ö', uuml: 'ü', aacute: 'á', agrave: 'à',
  ccedil: 'ç', laquo: '«', raquo: '»',
};

/** Decodes the HTML entities WordPress uses in titles and excerpts. Non-breaking spaces become spaces. */
export function decodeHtml(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match)
    .replace(/\u00a0/g, ' ');
}

export function stripTags(html: string): string {
  return decodeHtml(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** Shortens text to at most `max` characters, at a word boundary, with an ellipsis. */
export function truncate(text: string, max = MAX_EXCERPT): string {
  const clean = text.replace(/\s*\[(?:&hellip;|…|\.\.\.)\]\s*$/, '').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const atWord = cut.slice(0, Math.max(cut.lastIndexOf(' '), max * 0.6));
  return `${atWord.replace(/[\s,.;:]+$/, '')}…`;
}

/** The real address behind an l.facebook.com or l.messenger.com link. */
export function unwrapLink(href: string): string {
  try {
    const url = new URL(href);
    if (/^l\.(facebook|messenger)\.com$/.test(url.hostname)) {
      const target = new URL(url.searchParams.get('u') ?? '');
      target.searchParams.delete('fbclid');
      return target.href;
    }
  } catch {
    // not a valid URL: keep it
  }
  return href;
}

/**
 * A summary from the text of a post: whole sentences up to `max` characters,
 * or the text cut at a word when the first sentence is already too long.
 */
export function summarize(text: string, max = MAX_EXCERPT): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]+["')\]]*\s*/g) ?? [];
  let out = '';
  for (const sentence of sentences) {
    if ((out + sentence).trim().length > max) break;
    out += sentence;
  }
  return out.trim().length >= 40 ? out.trim() : truncate(clean, max);
}

/** WordPress `date` is local site time, e.g. `2023-04-12T10:00:00`. */
export function wpDate(date: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(date);
  if (!m?.[1]) throw new Error(`Ongeldige WordPress-datum: ${date}`);
  return m[1];
}

/** URL of the original upload instead of a resized copy (`foto-1024x768.jpg` → `foto.jpg`). */
export function fullSizeUrl(src: string): string {
  return src.replace(/-\d+x\d+(\.[a-z0-9]+)(\?.*)?$/i, '$1$2').replace(/-scaled(\.[a-z0-9]+)(\?.*)?$/i, '$1$2');
}

/** The largest candidate in a `srcset`, if any. */
export function largestFromSrcset(srcset: string | null | undefined): string | undefined {
  if (!srcset) return undefined;
  let best: { url: string; width: number } | undefined;
  for (const part of srcset.split(',')) {
    const [url, size] = part.trim().split(/\s+/);
    const width = Number.parseInt(size ?? '0', 10) || 0;
    if (url && (!best || width > best.width)) best = { url, width };
  }
  return best?.url;
}

export function youtubeUrl(src: string): string | undefined {
  const m = /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([\w-]{11})/.exec(src);
  return m ? `https://www.youtube.com/watch?v=${m[1]}` : undefined;
}

export interface ConvertedPost {
  /** Markdown with `{{img:N}}` placeholders for inline images. */
  markdown: string;
  /** Remote URLs of the inline images, by placeholder index. */
  inlineImages: string[];
  /** Remote URLs of gallery images (moved to the `gallery` field). */
  galleryImages: string[];
  videoUrl?: string;
  /** Video files that were left out. */
  droppedVideos: string[];
}

export const imagePlaceholder = (index: number) => `{{img:${index}}}`;

/**
 * Converts the HTML of a post to Markdown. Galleries and videos are taken out
 * of the text: gallery images go to the `gallery` field, a YouTube embed to
 * `videoUrl`, and a self-hosted video becomes a short note.
 */
export function convertPostHtml(html: string): ConvertedPost {
  const result: ConvertedPost = { markdown: '', inlineImages: [], galleryImages: [], droppedVideos: [] };

  const imageUrl = (node: HTMLElement): string | undefined => {
    const src = largestFromSrcset(node.getAttribute('srcset')) ?? node.getAttribute('data-src') ?? node.getAttribute('src');
    return src ? fullSizeUrl(src) : undefined;
  };

  const td = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    emDelimiter: '*',
    hr: '---',
  });

  const isGallery = (node: HTMLElement) =>
    (node.nodeName === 'FIGURE' || node.nodeName === 'DIV' || node.nodeName === 'UL') &&
    /\b(wp-block-gallery|gallery|blocks-gallery-grid|tiled-gallery)\b/.test(node.getAttribute('class') ?? '');
  const inGallery = (node: HTMLElement) => {
    for (let n = node.parentElement; n; n = n.parentElement) if (isGallery(n)) return true;
    return false;
  };

  td.addRule('gallery', {
    filter: (node) => isGallery(node),
    replacement: (_content, node) => {
      for (const img of Array.from((node as HTMLElement).querySelectorAll('img'))) {
        const url = imageUrl(img as HTMLElement);
        if (url && !result.galleryImages.includes(url)) result.galleryImages.push(url);
      }
      return '\n\n';
    },
  });

  td.addRule('image', {
    filter: 'img',
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      // WordPress replaces emoji by small images; keep the emoji itself.
      if (/\bemoji\b/.test(el.getAttribute('class') ?? '') || /s\.w\.org\/images\/core\/emoji/.test(el.getAttribute('src') ?? '')) {
        return el.getAttribute('alt') ?? '';
      }
      // Gallery images are collected by the gallery rule.
      if (inGallery(el)) return '';
      const url = imageUrl(el);
      if (!url) return '';
      const alt = decodeHtml((node as HTMLElement).getAttribute('alt') ?? '').replace(/[[\]]/g, '');
      let index = result.inlineImages.indexOf(url);
      if (index === -1) index = result.inlineImages.push(url) - 1;
      return `![${alt}](${imagePlaceholder(index)})`;
    },
  });

  // An image wrapped in a link to its own file: keep only the image.
  td.addRule('linkedImage', {
    filter: (node) =>
      node.nodeName === 'A' &&
      node.childNodes.length === 1 &&
      node.firstChild?.nodeName === 'IMG' &&
      /\.(jpe?g|png|gif|webp)(\?.*)?$/i.test(node.getAttribute('href') ?? ''),
    replacement: (content) => content,
  });

  td.addRule('iframe', {
    filter: 'iframe',
    replacement: (_content, node) => {
      const yt = youtubeUrl((node as HTMLElement).getAttribute('src') ?? '');
      if (yt) result.videoUrl ??= yt;
      return '\n\n';
    },
  });

  td.addRule('video', {
    filter: (node) =>
      node.nodeName === 'VIDEO' ||
      (node.nodeName === 'FIGURE' && /\bwp-block-video\b/.test(node.getAttribute('class') ?? '')) ||
      (node.nodeName === 'A' && /\.(mp4|mov|webm)(\?.*)?$/i.test(node.getAttribute('href') ?? '')),
    replacement: (_content, node) => {
      const el = node as HTMLElement;
      const src =
        el.getAttribute('href') ?? el.getAttribute('src') ?? el.querySelector('video, source')?.getAttribute('src') ?? '';
      if (src && !result.droppedVideos.includes(src)) result.droppedVideos.push(src);
      return `\n\n${VIDEO_UNAVAILABLE}\n\n`;
    },
  });

  // Links wrapped by Facebook or Messenger: link to the real address.
  td.addRule('trackedLink', {
    filter: (node) => node.nodeName === 'A' && /^https?:\/\/l\.(facebook|messenger)\.com\/l\.php\?/.test(node.getAttribute('href') ?? ''),
    replacement: (content, node) => {
      const target = unwrapLink((node as HTMLElement).getAttribute('href') ?? '');
      const text = content.trim();
      return text && !/^https?:\/\/l\./.test(text) ? `[${text}](${target})` : `[${target}](${target})`;
    },
  });

  td.remove(['script', 'style', 'noscript']);

  result.markdown = td
    .turndown(html)
    // A hard line break inside a sentence (pasted text): join the lines.
    .replace(/ {2}\n(?=[a-zà-ÿ(])/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    // Collapse repeated video notes (e.g. a figure that contains a video element).
    .replace(new RegExp(`(${escapeRegExp(VIDEO_UNAVAILABLE)}\\s*){2,}`, 'g'), `${VIDEO_UNAVAILABLE}\n\n`)
    .trim();
  return result;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Removes a leading image placeholder (one that comes before any text), e.g. when it becomes the cover. */
export function removeLeadingImage(markdown: string, index: number): string {
  const pattern = new RegExp(`^\\s*!\\[[^\\]]*\\]\\(${escapeRegExp(imagePlaceholder(index))}\\)\\s*`);
  return markdown.replace(pattern, '');
}

/** Section mail addresses and other known typos from the old site. */
export const TEXT_FIXES: [RegExp, string][] = [
  [/scoutsosselaar\.be/g, 'scoutsvosselaar.be'],
  [/contract op te nemen/g, 'contact op te nemen'],
];

export function fixText(text: string): string {
  return TEXT_FIXES.reduce((acc, [pattern, replacement]) => acc.replace(pattern, replacement), text);
}

/** `Groepsfoto's 2022-2023` → `2022-2023`. */
export function scoutYearLabel(title: string): string | undefined {
  const m = /(20\d{2})\s*[-–/]\s*(20\d{2})/.exec(title);
  if (!m) return undefined;
  return Number(m[2]) === Number(m[1]) + 1 ? `${m[1]}-${m[2]}` : undefined;
}

export interface FoundLink {
  href: string;
  text: string;
}

/** All links in a piece of HTML. */
export function findLinks(html: string): FoundLink[] {
  const links: FoundLink[] = [];
  const re = /<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  for (const m of html.matchAll(re)) {
    links.push({ href: decodeHtml(m[2] ?? ''), text: stripTags(m[3] ?? '') });
  }
  return links;
}

/** All image URLs in a piece of HTML, full size, without duplicates. */
export function findImages(html: string): string[] {
  const urls: string[] = [];
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    const attr = (name: string) => new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i').exec(tag)?.[2];
    const src = largestFromSrcset(attr('srcset')) ?? attr('data-src') ?? attr('src');
    if (src) {
      const url = fullSizeUrl(decodeHtml(src));
      if (!urls.includes(url)) urls.push(url);
    }
  }
  return urls;
}

/** A filesystem-safe slug. */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
