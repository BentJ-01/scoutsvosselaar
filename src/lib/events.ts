/**
 * How events are shown: dates, times and who they are for.
 */
import { formatTime, TIME_ZONE, type LocalDateTime } from './dates';

export interface EventTiming {
  start: LocalDateTime;
  end: LocalDateTime | null;
  allDay: boolean;
}

const weekday = new Intl.DateTimeFormat('nl-BE', { timeZone: TIME_ZONE, weekday: 'short' });
const day = new Intl.DateTimeFormat('nl-BE', { timeZone: TIME_ZONE, day: 'numeric' });
const month = new Intl.DateTimeFormat('nl-BE', { timeZone: TIME_ZONE, month: 'short' });
const dayMonth = new Intl.DateTimeFormat('nl-BE', { timeZone: TIME_ZONE, weekday: 'short', day: 'numeric', month: 'short' });
const monthYear = new Intl.DateTimeFormat('nl-BE', { timeZone: TIME_ZONE, month: 'long', year: 'numeric' });

const clean = (s: string) => s.replace(/\.$/, '');

/** Parts for a date stamp: "za", "24", "okt". */
export function stampParts(d: LocalDateTime): { weekday: string; day: string; month: string } {
  return { weekday: clean(weekday.format(d.utc)), day: day.format(d.utc), month: clean(month.format(d.utc)) };
}

/** "oktober 2026", for grouping the calendar per month. */
export function monthLabel(d: LocalDateTime): string {
  return monthYear.format(d.utc);
}

const shortDate = (d: LocalDateTime) => dayMonth.format(d.utc).replace(/\./g, '');

/**
 * "14u tot 16u30", "Vanaf 17u", "Hele dag", or for several days
 * "za 5 dec tot zo 6 dec" (with times unless it is all day).
 */
export function timeLabel({ start, end, allDay }: EventTiming): string {
  const validEnd = end && end.utc >= start.utc ? end : null;
  const multiDay = validEnd && validEnd.date !== start.date;

  if (multiDay) {
    return allDay
      ? `${shortDate(start)} tot ${shortDate(validEnd)}`
      : `${shortDate(start)} ${formatTime(start)} tot ${shortDate(validEnd)} ${formatTime(validEnd)}`;
  }
  if (allDay) return 'Hele dag';
  if (validEnd && validEnd.time !== start.time) return `${formatTime(start)} tot ${formatTime(validEnd)}`;
  return `Vanaf ${formatTime(start)}`;
}
