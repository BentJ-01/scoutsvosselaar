import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildTeams, eventEndsAt, pinnedPost, publishedPosts, resolveRefs, validEvents } from '../src/lib/content-core';
import { parseLocalDateTime } from '../src/lib/dates';

const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
afterEach(() => warn.mockClear());

const leaders = new Map([
  ['an', { name: 'An' }],
  ['bo', { name: 'Bo' }],
  ['cas', { name: 'Cas' }],
]);
const sections = new Map([
  ['kapoenen', { name: 'Kapoenen' }],
  ['welpen', { name: 'Welpen' }],
]);
const r = (id: string) => ({ id });

describe('resolveRefs', () => {
  it('skips missing references with a warning', () => {
    expect(resolveRefs([r('an'), r('weg'), r('an')], leaders, 'test')).toEqual([{ name: 'An' }]);
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('buildTeams', () => {
  it('puts section leads first and marks them', () => {
    const teams = buildTeams('2026-2027', [{ section: r('kapoenen'), leaders: [r('an'), r('bo')], sectionLeads: [r('bo')] }], sections, leaders);
    expect(teams.get('kapoenen')?.members.map((m) => [m.id, m.isLead])).toEqual([
      ['bo', true],
      ['an', false],
    ]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('lets one person be in several teams', () => {
    const teams = buildTeams(
      'x',
      [
        { section: r('kapoenen'), leaders: [r('an')], sectionLeads: [] },
        { section: r('welpen'), leaders: [r('an')], sectionLeads: [r('an')] },
      ],
      sections,
      leaders,
    );
    expect(teams.get('kapoenen')?.members).toHaveLength(1);
    expect(teams.get('welpen')?.members[0]?.isLead).toBe(true);
  });

  it('tolerates inconsistent content', () => {
    const teams = buildTeams(
      'x',
      [
        { section: r('kapoenen'), leaders: [r('an'), r('verwijderd')], sectionLeads: [r('cas')] },
        { section: r('kapoenen'), leaders: [r('bo')], sectionLeads: [] },
        { section: r('bestaat-niet'), leaders: [r('an')], sectionLeads: [] },
        { section: undefined, leaders: [], sectionLeads: [] },
      ],
      sections,
      leaders,
    );
    expect([...teams.keys()]).toEqual(['kapoenen']);
    expect(teams.get('kapoenen')?.members.map((m) => m.id)).toEqual(['cas', 'an', 'bo']);
    expect(warn).toHaveBeenCalledTimes(5);
  });
});

const date = (s: string) => parseLocalDateTime(s);

describe('posts', () => {
  const posts = [
    { id: 'a', data: { title: 'A', date: date('2026-09-01'), draft: false, pinned: true } },
    { id: 'b', data: { title: 'B', date: date('2026-10-01'), draft: false, pinned: true } },
    { id: 'c', data: { title: 'C', date: date('2026-10-05'), draft: true, pinned: true } },
    { id: 'd', data: { title: 'D', date: null, draft: false, pinned: false } },
  ];

  it('leaves out drafts and posts without date, newest first', () => {
    expect(publishedPosts(posts).map((p) => p.id)).toEqual(['b', 'a']);
  });

  it('shows only the newest pinned post', () => {
    expect(pinnedPost(publishedPosts(posts))?.id).toBe('b');
  });
});

describe('events', () => {
  it('sorts chronologically and drops events without start', () => {
    const events = validEvents([
      { id: 'late', data: { start: date('2026-12-01T10:00'), end: null } },
      { id: 'none', data: { start: null, end: null } },
      { id: 'early', data: { start: date('2026-11-01T10:00'), end: null } },
    ]);
    expect(events.map((e) => e.id)).toEqual(['early', 'late']);
  });

  it('ends at midnight Brussels time when there is no end, also on the DST day', () => {
    const start = date('2026-10-25T14:00')!;
    expect(eventEndsAt({ start, end: null }).toISOString()).toBe('2026-10-25T23:00:00.000Z');
    expect(eventEndsAt({ start, end: date('2026-10-25T16:00') }).toISOString()).toBe('2026-10-25T15:00:00.000Z');
  });
});
