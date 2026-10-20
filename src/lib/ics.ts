/**
 * iCalendar (RFC 5545) feeds for the calendar.
 *
 * Times are written as Brussels wall-clock time with TZID=Europe/Brussels and
 * a VTIMEZONE block. Dates are passed to ical-generator as Luxon objects in
 * that zone, because a plain Date would be written in the time zone of the
 * machine running the build. DTSTAMP is fixed per event, so the same content
 * always gives the same file.
 */
import { getVtimezoneComponent } from '@touch4it/ical-timezones';
import { ICalCalendar, ICalEventStatus } from 'ical-generator';
import { DateTime } from 'luxon';
import { TIME_ZONE, type LocalDateTime } from './dates';

export interface IcsEvent {
  /** Stable id, used for the UID. */
  id: string;
  title: string;
  start: LocalDateTime;
  end: LocalDateTime | null;
  allDay: boolean;
  location?: string | undefined;
  description?: string | undefined;
  price?: string | undefined;
  link?: { url: string; label?: string | undefined } | undefined;
  cancelled: boolean;
  /** Absolute URL of the event page. */
  url: string;
}

export interface IcsCalendar {
  name: string;
  description?: string;
  /** Absolute URL of the calendar page. */
  url: string;
  events: IcsEvent[];
}

const UID_DOMAIN = 'scoutsvosselaar.be';

const zoned = (d: LocalDateTime) => DateTime.fromISO(d.local, { zone: TIME_ZONE });

function description(e: IcsEvent): string {
  return [
    e.cancelled ? 'Dit evenement is geannuleerd.' : '',
    e.description?.trim() ?? '',
    e.price ? `Prijs: ${e.price}` : '',
    e.link ? `${e.link.label ?? 'Link'}: ${e.link.url}` : '',
    `Meer info: ${e.url}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildCalendar({ name, description: calDescription, url, events }: IcsCalendar): string {
  const cal = new ICalCalendar({
    name,
    description: calDescription,
    url,
    prodId: { company: 'Scouts Don Bosco Vosselaar', product: 'website', language: 'NL' },
    ttl: 6 * 60 * 60,
  });
  cal.timezone({ name: TIME_ZONE, generator: getVtimezoneComponent });

  for (const e of events) {
    const start = zoned(e.start);
    const end = e.end && e.end.utc >= e.start.utc ? zoned(e.end) : null;

    const common = {
      id: `${e.id}@${UID_DOMAIN}`,
      summary: e.title,
      // Fixed, so a rebuild without changes gives an identical file.
      stamp: start.toUTC(),
      location: e.location,
      description: description(e),
      url: e.url,
      status: e.cancelled ? ICalEventStatus.CANCELLED : ICalEventStatus.CONFIRMED,
      timezone: TIME_ZONE,
    };

    if (e.allDay) {
      // All-day: DTEND is exclusive, so the day after the last day.
      const lastDay = (end ?? start).startOf('day');
      cal.createEvent({ ...common, allDay: true, start: start.startOf('day'), end: lastDay.plus({ days: 1 }) });
    } else {
      cal.createEvent({ ...common, start, end: end ?? undefined });
    }
  }
  return cal.toString();
}

/** webcal:// variant of a feed URL, which calendar apps open as a subscription. */
export function webcalUrl(feedUrl: string): string {
  return feedUrl.replace(/^https?:\/\//, 'webcal://');
}
