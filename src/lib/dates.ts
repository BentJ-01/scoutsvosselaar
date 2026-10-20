/**
 * Date helpers. All times in the content are local wall-clock time in
 * Europe/Brussels. Nothing here may depend on the system time zone: the build
 * runs in UTC on GitHub Actions and must give the same output as locally.
 */

export const TIME_ZONE = 'Europe/Brussels';

/** A wall-clock moment in Brussels plus the matching absolute instant. */
export interface LocalDateTime {
  /** `YYYY-MM-DD` in Brussels. */
  date: string;
  /** `HH:mm` in Brussels. */
  time: string;
  /** `YYYY-MM-DDTHH:mm` in Brussels. */
  local: string;
  /** The absolute instant. */
  utc: Date;
}

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

interface WallParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function wallPartsOf(instant: Date): WallParts {
  const parts: Record<string, number> = {};
  for (const p of partsFormatter.formatToParts(instant)) {
    if (p.type !== 'literal') parts[p.type] = Number(p.value);
  }
  return {
    year: parts.year ?? 0,
    month: parts.month ?? 1,
    day: parts.day ?? 1,
    hour: parts.hour ?? 0,
    minute: parts.minute ?? 0,
  };
}

/** Offset of Brussels from UTC at the given instant, in minutes (60 or 120). */
export function brusselsOffsetMinutes(instant: Date): number {
  const w = wallPartsOf(instant);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
  const truncated = Math.floor(instant.getTime() / 60_000) * 60_000;
  return Math.round((asUtc - truncated) / 60_000);
}

/** Converts a Brussels wall-clock time to the absolute instant. */
export function brusselsToUtc(w: WallParts): Date {
  const guess = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
  const first = guess - brusselsOffsetMinutes(new Date(guess)) * 60_000;
  const second = guess - brusselsOffsetMinutes(new Date(first)) * 60_000;
  return new Date(second);
}

const pad = (n: number) => String(n).padStart(2, '0');

function fromWall(w: WallParts): LocalDateTime {
  const date = `${w.year}-${pad(w.month)}-${pad(w.day)}`;
  const time = `${pad(w.hour)}:${pad(w.minute)}`;
  return { date, time, local: `${date}T${time}`, utc: brusselsToUtc(w) };
}

/** Converts an absolute instant to Brussels wall-clock time. */
export function utcToLocal(instant: Date): LocalDateTime {
  return { ...fromWall(wallPartsOf(instant)), utc: instant };
}

const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?)?$/;
const HAS_OFFSET_RE = /(?:Z|[+-]\d{2}:?\d{2})$/i;

/**
 * Parses a date or date-time from content.
 *
 * - A string without offset (`2026-10-25T14:00`, `2026-10-25`) is Brussels time.
 * - A string with offset (`...Z`, `...+02:00`) is an absolute instant.
 * - A `Date` comes from the YAML parser, which reads timestamps without offset
 *   as UTC. Its UTC fields are therefore the wall-clock time that was written.
 *
 * Returns `null` for anything that is not a valid date.
 */
export function parseLocalDateTime(input: unknown): LocalDateTime | null {
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    return fromWall({
      year: input.getUTCFullYear(),
      month: input.getUTCMonth() + 1,
      day: input.getUTCDate(),
      hour: input.getUTCHours(),
      minute: input.getUTCMinutes(),
    });
  }
  if (typeof input !== 'string') return null;
  const value = input.trim();

  if (HAS_OFFSET_RE.test(value)) {
    const instant = new Date(value);
    return Number.isNaN(instant.getTime()) ? null : utcToLocal(instant);
  }

  const m = LOCAL_RE.exec(value);
  if (!m) return null;
  const w: WallParts = {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3]),
    hour: Number(m[4] ?? 0),
    minute: Number(m[5] ?? 0),
  };
  const check = new Date(Date.UTC(w.year, w.month - 1, w.day));
  if (check.getUTCMonth() !== w.month - 1 || check.getUTCDate() !== w.day) return null;
  if (w.hour > 23 || w.minute > 59) return null;
  return fromWall(w);
}

/** Today's date (`YYYY-MM-DD`) in Brussels. */
export function todayInBrussels(now: Date = new Date()): string {
  return utcToLocal(now).date;
}

const dateFormatter = new Intl.DateTimeFormat('nl-BE', {
  timeZone: TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('nl-BE', {
  timeZone: TIME_ZONE,
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** "zondag 25 oktober 2026" */
export function formatLongDate(d: LocalDateTime): string {
  return dateFormatter.format(d.utc);
}

/** "25 oktober 2026" */
export function formatDate(d: LocalDateTime): string {
  return shortDateFormatter.format(d.utc);
}

/** "14u" or "14u30" */
export function formatTime(d: LocalDateTime): string {
  const [h, m] = d.time.split(':');
  return m === '00' ? `${Number(h)}u` : `${Number(h)}u${m}`;
}
