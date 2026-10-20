/**
 * Content access for pages. Thin wrappers around `astro:content` that use the
 * tolerant logic from `content-core`.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import { buildTeams, pinnedPost, publishedPosts, resolveRefs, validEvents, type Team } from './content-core';
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
