/**
 * Content access for pages. Thin wrappers around `astro:content` that use the
 * tolerant logic from `content-core`.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { buildTeams, eventEndsAt, pinnedPost, publishedPosts, resolveRefs, validEvents, type Team } from './content-core';
import { contentWarning } from './log';

export type Section = CollectionEntry<'sections'>;
export type Leader = CollectionEntry<'leaders'>;
export type ScoutYear = CollectionEntry<'scout-years'>;

const byId = <T extends { id: string }>(items: readonly T[]) => new Map(items.map((i) => [i.id, i]));

/** Sections in display order (by `order`, then name). */
export async function getSections(): Promise<Section[]> {
  const sections = await getCollection('sections');
  return sections.sort((a, b) => a.data.order - b.data.order || a.data.name.localeCompare(b.data.name, 'nl'));
}

/** The active scout year from the settings, or the most recent one as fallback. */
export async function getCurrentYear(): Promise<ScoutYear | undefined> {
  const [settings, years] = await Promise.all([getCollection('settings'), getCollection('scout-years')]);
  const wanted = settings.find((s) => s.id === 'site')?.data.currentYear?.id;
  const year = wanted ? years.find((y) => y.id === wanted) : undefined;
  if (year) return year;
  if (wanted) contentWarning(`Instellingen: actief werkjaar "${wanted}" bestaat niet. Meest recente werkjaar gebruikt.`);
  return years.sort((a, b) => b.data.label.localeCompare(a.data.label))[0];
}

export interface YearOverview {
  year: ScoutYear;
  groupLeaders: Leader[];
  /** Teams in section order. */
  teams: Team<Section, Leader>[];
}

/** Group leaders and teams of a scout year, with all references resolved. */
export async function getYearOverview(year: ScoutYear): Promise<YearOverview> {
  const [sections, leaders] = await Promise.all([getSections(), getCollection('leaders')]);
  const leaderMap = byId(leaders);
  const teams = buildTeams(year.data.label, year.data.sectionTeams, byId(sections), leaderMap);
  return {
    year,
    groupLeaders: resolveRefs(year.data.groupLeaders, leaderMap, `Werkjaar ${year.data.label}, groepsleiding`),
    teams: sections.flatMap((s) => teams.get(s.id) ?? []),
  };
}

/** Published posts, newest first. */
export async function getPosts() {
  return publishedPosts(await getCollection('posts'));
}

export async function getPinnedPost() {
  return pinnedPost(await getPosts());
}

/** All events with a valid start, chronological. Filtering on "upcoming" happens client-side. */
export async function getEvents() {
  return validEvents(await getCollection('events'));
}

export type Post = Awaited<ReturnType<typeof getPosts>>[number];
export type CalendarEvent = Awaited<ReturnType<typeof getEvents>>[number];

/** Sections by id, for looking up the sections an event or post is for. */
export async function getSectionMap(): Promise<Map<string, Section>> {
  return byId(await getSections());
}

/** The sections an entry refers to, leaving out ones that no longer exist. */
export function sectionsOf(refs: readonly { id: string }[], sections: ReadonlyMap<string, Section>): Section[] {
  return refs.flatMap((r) => sections.get(r.id) ?? []);
}

/**
 * Events that were not over yet at build time, chronological. Pages show
 * these and a small script hides the ones that ended since the build, so
 * past events never show up as upcoming, even without a recent build.
 */
export async function getUpcomingEvents(now = new Date()) {
  return (await getEvents()).filter((e) => eventEndsAt(e.data) > now);
}

/** All scout years, newest first. */
export async function getScoutYears(): Promise<ScoutYear[]> {
  return (await getCollection('scout-years')).sort((a, b) => b.data.label.localeCompare(a.data.label));
}

/** Editions of 't Voske with a PDF, newest first. */
export async function getVoskes() {
  const voskes = await getCollection('voskes');
  return voskes
    .filter((v) => {
      if (v.data.pdf) return true;
      contentWarning(`'t Voske "${v.id}" heeft geen PDF. Niet getoond.`);
      return false;
    })
    .sort((a, b) => (b.data.date?.utc.getTime() ?? 0) - (a.data.date?.utc.getTime() ?? 0));
}

/** Photo albums with a link, newest first. */
export async function getAlbums() {
  const albums = await getCollection('albums');
  return albums
    .filter((a) => {
      if (a.data.albumUrl) return true;
      contentWarning(`Fotoalbum "${a.id}" heeft geen link. Niet getoond.`);
      return false;
    })
    .sort((a, b) => (b.data.date?.utc.getTime() ?? 0) - (a.data.date?.utc.getTime() ?? 0));
}
