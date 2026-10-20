import type { APIRoute } from 'astro';
import { absoluteUrl, toIcsEvent } from '@/lib/calendar';
import { getEvents } from '@/lib/content';
import { buildCalendar } from '@/lib/ics';
import { site as group } from '@/site.config';

export const GET: APIRoute = async ({ site }) =>
  new Response(
    buildCalendar({
      name: group.shortName,
      description: `Alle activiteiten van ${group.name}.`,
      url: absoluteUrl('/kalender/', site),
      events: (await getEvents()).map((e) => toIcsEvent(e, site)),
    }),
    { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } },
  );
