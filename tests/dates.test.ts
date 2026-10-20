import { describe, expect, it } from 'vitest';
import {
  brusselsOffsetMinutes,
  formatLongDate,
  formatTime,
  parseLocalDateTime,
  todayInBrussels,
} from '../src/lib/dates';

describe('parseLocalDateTime', () => {
  it('reads a string without offset as Brussels time (winter)', () => {
    const d = parseLocalDateTime('2026-12-06T14:00');
    expect(d?.utc.toISOString()).toBe('2026-12-06T13:00:00.000Z');
    expect(d?.local).toBe('2026-12-06T14:00');
  });

  it('reads a string without offset as Brussels time (summer)', () => {
    const d = parseLocalDateTime('2026-07-15T14:00');
    expect(d?.utc.toISOString()).toBe('2026-07-15T12:00:00.000Z');
  });

  it('handles the switch to winter time (last Sunday of October)', () => {
    expect(parseLocalDateTime('2026-10-24T14:00')?.utc.toISOString()).toBe('2026-10-24T12:00:00.000Z');
    expect(parseLocalDateTime('2026-10-25T14:00')?.utc.toISOString()).toBe('2026-10-25T13:00:00.000Z');
  });

  it('handles the switch to summer time (last Sunday of March)', () => {
    expect(parseLocalDateTime('2027-03-27T14:00')?.utc.toISOString()).toBe('2027-03-27T13:00:00.000Z');
    expect(parseLocalDateTime('2027-03-28T14:00')?.utc.toISOString()).toBe('2027-03-28T12:00:00.000Z');
  });

  it('reads a date only as midnight in Brussels', () => {
    const d = parseLocalDateTime('2026-10-25');
    expect(d?.date).toBe('2026-10-25');
    expect(d?.utc.toISOString()).toBe('2026-10-24T22:00:00.000Z');
  });

  it('reads a YAML Date (parsed as UTC) as the written wall time', () => {
    const d = parseLocalDateTime(new Date('2026-10-25T14:00:00Z'));
    expect(d?.local).toBe('2026-10-25T14:00');
    expect(d?.utc.toISOString()).toBe('2026-10-25T13:00:00.000Z');
  });

  it('respects an explicit offset', () => {
    const d = parseLocalDateTime('2026-07-15T12:00:00Z');
    expect(d?.local).toBe('2026-07-15T14:00');
  });

  it('rejects invalid input', () => {
    expect(parseLocalDateTime('2026-02-30')).toBeNull();
    expect(parseLocalDateTime('morgen')).toBeNull();
    expect(parseLocalDateTime(undefined)).toBeNull();
    expect(parseLocalDateTime(new Date('x'))).toBeNull();
  });
});

describe('helpers', () => {
  it('gives the Brussels offset', () => {
    expect(brusselsOffsetMinutes(new Date('2026-01-01T12:00:00Z'))).toBe(60);
    expect(brusselsOffsetMinutes(new Date('2026-07-01T12:00:00Z'))).toBe(120);
  });

  it('gives today in Brussels, not in UTC', () => {
    expect(todayInBrussels(new Date('2026-10-20T22:30:00Z'))).toBe('2026-10-21');
  });

  it('formats in Dutch', () => {
    const d = parseLocalDateTime('2026-10-25T14:30')!;
    expect(formatLongDate(d)).toBe('zondag 25 oktober 2026');
    expect(formatTime(d)).toBe('14u30');
    expect(formatTime(parseLocalDateTime('2026-10-25T09:00')!)).toBe('9u');
  });
});
