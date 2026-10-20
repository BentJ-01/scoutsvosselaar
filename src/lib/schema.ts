/**
 * Lenient schema building blocks. A content error by an editor must never
 * fail the build: invalid values fall back to a default and are logged.
 * Required fields are enforced by the CMS, not here.
 */
import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { z } from 'astro/zod';
import type { SchemaContext } from 'astro:content';
import { CONTENT_DIR } from './content-dir';
import { contentWarning } from './log';
import { parseLocalDateTime, type LocalDateTime } from './dates';

const show = (v: unknown) => {
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return s === undefined ? String(v) : s.length > 60 ? `${s.slice(0, 57)}...` : s;
};

/** Falls back to `fallback` (with a warning) when the value is invalid. */
export function soft<T extends z.ZodType>(field: string, schema: T, fallback: z.output<T>) {
  return schema.catch((ctx) => {
    if (ctx.value !== undefined) {
      contentWarning(`Ongeldige waarde voor "${field}": ${show(ctx.value)}. Standaardwaarde gebruikt.`);
    }
    return fallback;
  });
}

/** Text. Missing or invalid becomes an empty string. */
export const text = (field: string) => soft(field, z.string().trim(), '');

/** Optional text. Empty strings become `undefined`. */
export const optionalText = (field: string) =>
  soft(
    field,
    z
      .string()
      .trim()
      .optional()
      .transform((v) => (v ? v : undefined)),
    undefined,
  );

/** Text with a maximum length that only warns. */
export const limitedText = (field: string, max: number) =>
  text(field).transform((v) => {
    if (v.length > max) contentWarning(`"${field}" is ${v.length} tekens lang (max ${max}): "${show(v)}"`);
    return v;
  });

/** Optional URL (http or https). Invalid becomes `undefined`. */
export const optionalUrl = (field: string) =>
  optionalText(field).transform((v) => {
    if (v === undefined) return undefined;
    try {
      const u = new URL(v);
      if (u.protocol === 'http:' || u.protocol === 'https:' || u.protocol === 'mailto:') return v;
    } catch {
      // fall through
    }
    contentWarning(`Ongeldige link voor "${field}": ${show(v)}`);
    return undefined;
  });

export const bool = (field: string, fallback = false) => soft(field, z.boolean(), fallback);

/** A Brussels date or date-time. Invalid becomes `null` (the entry is then skipped by the helpers). */
export const localDateTime = (field: string) =>
  z
    .unknown()
    .optional()
    .transform((v): LocalDateTime | null => {
    if (v === undefined || v === null || v === '') return null;
    const parsed = parseLocalDateTime(v);
    if (!parsed) contentWarning(`Ongeldige datum voor "${field}": ${show(v)}`);
    return parsed;
  });

/** A list that tolerates a missing value and warns above `max` items. */
export function list<T extends z.ZodType>(field: string, item: T, max?: number) {
  return soft(field, z.array(item), [] as z.output<T>[]).transform((items) => {
    if (max !== undefined && items.length > max) {
      contentWarning(`"${field}" bevat ${items.length} items (max ${max}). Enkel de eerste ${max} worden gebruikt.`);
      return items.slice(0, max);
    }
    return items;
  });
}

/** Day and month only, e.g. "24/03" or "24-03". */
export const dayMonth = (field: string) =>
  optionalText(field).transform((v) => {
    if (v === undefined) return undefined;
    const m = /^(\d{1,2})[/-](\d{1,2})$/.exec(v);
    const day = Number(m?.[1]);
    const month = Number(m?.[2]);
    if (!m || month < 1 || month > 12 || day < 1 || day > 31) {
      contentWarning(`Ongeldige verjaardag voor "${field}": ${show(v)}`);
      return undefined;
    }
    return { day, month };
  });

/** A CSS hex color. */
export const hexColor = (field: string, fallback: string) =>
  soft(field, z.string().regex(/^#[0-9a-f]{6}$/i), fallback);

type ImageSchema = ReturnType<SchemaContext['image']>;

/**
 * Wraps Astro's `image()` so a missing file is skipped with a warning instead
 * of failing the build. Paths are relative to the entry file, and every entry
 * lives directly in `<CONTENT_DIR>/<dir>/`.
 */
export function imageHelpers(image: SchemaContext['image'], dir: string) {
  const entryDir = resolve(process.cwd(), CONTENT_DIR, dir);
  const exists = (path: string) => {
    if (/^https?:\/\//.test(path)) return true;
    const full = isAbsolute(path) ? resolve(process.cwd(), `.${path}`) : resolve(entryDir, path);
    return existsSync(full);
  };
  const present = (field: string) => (v: unknown) => {
    if (typeof v !== 'string' || v.trim() === '') return undefined;
    if (exists(v.trim())) return v.trim();
    contentWarning(`Afbeelding niet gevonden voor "${field}": ${v}. Overgeslagen.`);
    return undefined;
  };

  /** An optional image. */
  const optionalImage = (field: string) =>
    z.preprocess(present(field), image().optional()) as unknown as z.ZodOptional<ImageSchema>;

  /** A list of images; missing files are left out. */
  const images = (field: string, max?: number) =>
    z.preprocess((v) => {
      if (!Array.isArray(v)) return [];
      return v.map((item) => present(field)(item)).filter((item) => item !== undefined);
    }, list(field, image(), max));

  return { optionalImage, images };
}
