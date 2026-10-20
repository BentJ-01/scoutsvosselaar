import { describe, expect, it } from 'vitest';
import { parseLocalDateTime } from '../src/lib/dates';
import { monthLabel, stampParts, timeLabel } from '../src/lib/events';

const d = (s: string) => parseLocalDateTime(s)!;

describe('event labels', () => {
  it('gives the parts of a date stamp', () => {
    expect(stampParts(d('2026-10-24T18:00'))).toEqual({ weekday: 'za', day: '24', month: 'okt' });
    expect(monthLabel(d('2026-10-24T18:00'))).toBe('oktober 2026');
  });

  it('describes the time', () => {
    expect(timeLabel({ start: d('2026-10-24T18:00'), end: d('2026-10-24T21:30'), allDay: false })).toBe('18u tot 21u30');
    expect(timeLabel({ start: d('2026-11-14T17:00'), end: null, allDay: false })).toBe('Vanaf 17u');
    expect(timeLabel({ start: d('2026-11-14'), end: null, allDay: true })).toBe('Hele dag');
    expect(timeLabel({ start: d('2026-12-05'), end: d('2026-12-06'), allDay: true })).toBe('za 5 dec tot zo 6 dec');
    expect(timeLabel({ start: d('2026-12-05T10:00'), end: d('2026-12-06T16:00'), allDay: false })).toBe('za 5 dec 10u tot zo 6 dec 16u');
  });

  it('ignores an end before the start', () => {
    expect(timeLabel({ start: d('2026-11-14T17:00'), end: d('2026-11-14T15:00'), allDay: false })).toBe('Vanaf 17u');
  });
});
