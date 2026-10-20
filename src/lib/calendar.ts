/**
 * Calendar helpers shared by the calendar pages and the ICS feeds.
 */
import type { CalendarEvent } from './content';
import type { IcsEvent } from './ics';
import { url } from './paths';

export const feedPath = {
  all: '/ics/alle.ics',
  section: (sectionId: string) => `/ics/${sectionId}.ics`,
  event: (eventId: string) => `/ics/evenement/${eventId}.ics`,
};

/** Absolute URL of a page or file of the site, including the base path. */
export const absoluteUrl = (path: string, site: URL | undefined) => new URL(url(path), site).href;

/** Events of a section: its own events and the ones for the whole group. */
export function eventsForSection<E extends CalendarEvent>(events: readonly E[], sectionId: string): E[] {
  return events.filter((e) => e.data.sections.length === 0 || e.data.sections.some((r) => r.id === sectionId));
}

/** Markdown as plain text, for the description in a calendar app. */
function plainText(markdown: string | undefined): string | undefined {
  if (!markdown) return undefined;
  return markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/^#+\s*/gm, '')
    .replace(/[*_`]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function toIcsEvent(event: CalendarEvent, site: URL | undefined): IcsEvent {
  const d = event.data;
  return {
    id: event.id,
    title: d.title,
    start: d.start,
    end: d.end,
    allDay: d.allDay,
    location: d.location,
    description: plainText(event.body),
    price: d.price,
    link: d.linkUrl ? { url: d.linkUrl, label: d.linkLabel } : undefined,
    cancelled: d.cancelled,
    url: absoluteUrl(`/kalender/${event.id}/`, site),
  };
}
