import type { APIRoute, GetStaticPaths } from 'astro';
import { absoluteUrl, toIcsEvent } from '@/lib/calendar';
import { getEvents, type CalendarEvent } from '@/lib/content';
import { buildCalendar } from '@/lib/ics';
import { site as group } from '@/site.config';

export const getStaticPaths = (async () => (await getEvents()).map((event) => ({ params: { slug: event.id }, props: { event } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props, site }) => {
  const { event } = props as { event: CalendarEvent };
  return new Response(
    buildCalendar({ name: `${event.data.title}, ${group.shortName}`, url: absoluteUrl(`/kalender/${event.id}/`, site), events: [toIcsEvent(event, site)] }),
    { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } },
  );
};
