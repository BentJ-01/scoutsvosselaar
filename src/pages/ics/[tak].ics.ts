import type { APIRoute, GetStaticPaths } from 'astro';
import { absoluteUrl, eventsForSection, toIcsEvent } from '@/lib/calendar';
import { getEvents, getSections, type Section } from '@/lib/content';
import { buildCalendar } from '@/lib/ics';
import { site as group } from '@/site.config';

export const getStaticPaths = (async () => (await getSections()).map((section) => ({ params: { tak: section.id }, props: { section } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props, site }) => {
  const { section } = props as { section: Section };
  return new Response(
    buildCalendar({
      name: `${group.shortName}: ${section.data.name}`,
      description: `Activiteiten van de ${section.data.name.toLowerCase()} en van de hele groep, ${group.name}.`,
      url: absoluteUrl(`/kalender/#tak-${section.id}`, site),
      events: eventsForSection(await getEvents(), section.id).map((e) => toIcsEvent(e, site)),
    }),
    { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } },
  );
};
