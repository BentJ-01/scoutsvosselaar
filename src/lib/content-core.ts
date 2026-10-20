/**
 * Pure content logic, independent of `astro:content` so it can be unit tested.
 * Inconsistent content is logged and skipped, never thrown.
 */
import { contentWarning } from './log';
import { brusselsToUtc, type LocalDateTime } from './dates';

export interface Ref {
  id: string;
}

export interface Entry<D> {
  id: string;
  data: D;
}

/** Looks up references, leaving out (and logging) ones that no longer exist. */
export function resolveRefs<T>(refs: readonly Ref[], byId: ReadonlyMap<string, T>, context: string): T[] {
  const result: T[] = [];
  const seen = new Set<string>();
  for (const ref of refs) {
    if (seen.has(ref.id)) continue;
    seen.add(ref.id);
    const item = byId.get(ref.id);
    if (item === undefined) {
      contentWarning(`${context}: "${ref.id}" bestaat niet (meer). Overgeslagen.`);
    } else {
      result.push(item);
    }
  }
  return result;
}

export interface TeamInput {
  section?: Ref | undefined;
  leaders: Ref[];
  sectionLeads: Ref[];
}

export interface Team<S, L> {
  section: S;
  /** All leaders of the team, section leads first. */
  members: { id: string; leader: L; isLead: boolean }[];
}

/**
 * Builds the teams of a scout year. A missing section or leader is skipped,
 * a section that appears twice is merged into the first, and a section lead
 * that is not in the team is still shown as a member of the team.
 */
export function buildTeams<S, L>(
  yearLabel: string,
  input: readonly TeamInput[],
  sections: ReadonlyMap<string, S>,
  leaders: ReadonlyMap<string, L>,
): Map<string, Team<S, L>> {
  const teams = new Map<string, Team<S, L>>();
  const context = `Werkjaar ${yearLabel}`;

  for (const item of input) {
    if (!item.section) {
      contentWarning(`${context}: een tak in de indeling heeft geen tak gekozen. Overgeslagen.`);
      continue;
    }
    const section = sections.get(item.section.id);
    if (section === undefined) {
      contentWarning(`${context}: tak "${item.section.id}" bestaat niet. Overgeslagen.`);
      continue;
    }
    const sectionContext = `${context}, tak ${item.section.id}`;
    const memberIds = new Set(item.leaders.map((r) => r.id));
    for (const lead of item.sectionLeads) {
      if (!memberIds.has(lead.id)) {
        contentWarning(`${sectionContext}: takleider "${lead.id}" staat niet in het team. Toch toegevoegd.`);
      }
    }

    let team = teams.get(item.section.id);
    if (team) {
      contentWarning(`${context}: tak "${item.section.id}" staat meer dan eens in de indeling. Samengevoegd.`);
    } else {
      team = { section, members: [] };
      teams.set(item.section.id, team);
    }

    const leadIds = new Set(item.sectionLeads.map((r) => r.id));
    const present = new Set(team.members.map((m) => m.id));
    for (const ref of [...item.sectionLeads, ...item.leaders]) {
      if (present.has(ref.id)) continue;
      present.add(ref.id);
      const leader = leaders.get(ref.id);
      if (leader === undefined) {
        contentWarning(`${sectionContext}: "${ref.id}" bestaat niet (meer). Overgeslagen.`);
        continue;
      }
      team.members.push({ id: ref.id, leader, isLead: leadIds.has(ref.id) });
    }
  }
  return teams;
}

interface Dated {
  date: LocalDateTime | null;
}

interface PostLike extends Dated {
  title: string;
  draft: boolean;
  pinned: boolean;
}

/** Published posts with a valid date, newest first. */
export function publishedPosts<E extends Entry<PostLike>>(posts: readonly E[]): E[] {
  return posts
    .filter((p) => {
      if (p.data.draft) return false;
      if (!p.data.date) {
        contentWarning(`Bericht "${p.id}" heeft geen geldige datum. Niet getoond.`);
        return false;
      }
      return true;
    })
    .sort(byDateDesc);
}

/** The newest pinned post, if any. Expects `publishedPosts` output. */
export function pinnedPost<E extends Entry<PostLike>>(published: readonly E[]): E | undefined {
  return published.find((p) => p.data.pinned);
}

function byDateDesc(a: Entry<Dated>, b: Entry<Dated>): number {
  return (b.data.date?.utc.getTime() ?? 0) - (a.data.date?.utc.getTime() ?? 0) || a.id.localeCompare(b.id);
}

interface EventLike {
  start: LocalDateTime | null;
  end: LocalDateTime | null;
}

/** Events with a valid start, in chronological order. */
export function validEvents<E extends Entry<EventLike>>(events: readonly E[]): (E & { data: { start: LocalDateTime } })[] {
  return events
    .filter((e): e is E & { data: { start: LocalDateTime } } => {
      if (!e.data.start) {
        contentWarning(`Evenement "${e.id}" heeft geen geldige startdatum. Niet getoond.`);
        return false;
      }
      if (e.data.end && e.data.end.utc < e.data.start.utc) {
        contentWarning(`Evenement "${e.id}" eindigt voor het begint. Einde genegeerd.`);
      }
      return true;
    })
    .sort((a, b) => a.data.start.utc.getTime() - b.data.start.utc.getTime() || a.id.localeCompare(b.id));
}

/** The moment an event is over: its end, or the end of its start day. */
export function eventEndsAt(e: EventLike & { start: LocalDateTime }): Date {
  if (e.end && e.end.utc >= e.start.utc) return e.end.utc;
  const [year, month, day] = e.start.date.split('-').map(Number) as [number, number, number];
  return brusselsToUtc({ year, month, day: day + 1, hour: 0, minute: 0 });
}
