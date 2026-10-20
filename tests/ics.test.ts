import ICAL from 'ical.js';
import { describe, expect, it } from 'vitest';
import { parseLocalDateTime } from '../src/lib/dates';
import { buildCalendar, webcalUrl, type IcsEvent } from '../src/lib/ics';

const d = (s: string) => parseLocalDateTime(s)!;

const event = (over: Partial<IcsEvent>): IcsEvent => ({
  id: '2026-10-25-tocht',
  title: 'Tocht',
  start: d('2026-10-25T14:00'),
  end: d('2026-10-25T16:30'),
  allDay: false,
  cancelled: false,
  url: 'https://scoutsvosselaar.be/kalender/2026-10-25-tocht/',
  ...over,
});

const calendar = (events: IcsEvent[]) =>
  buildCalendar({ name: 'Scouts Vosselaar', url: 'https://scoutsvosselaar.be/kalender/', events });

/** Parses with ical.js, an independent implementation, and returns the events. */
function parse(ics: string) {
  const component = new ICAL.Component(ICAL.parse(ics));
  for (const tz of component.getAllSubcomponents('vtimezone')) ICAL.TimezoneService.register(new ICAL.Timezone(tz));
  return component.getAllSubcomponents('vevent').map((v) => new ICAL.Event(v));
}

describe('buildCalendar', () => {
  it('writes Brussels times with a TZID and a VTIMEZONE', () => {
    const ics = calendar([event({})]);
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:Europe/Brussels');
    expect(ics).toContain('DTSTART;TZID=Europe/Brussels:20261025T140000');
    expect(ics).toContain('DTEND;TZID=Europe/Brussels:20261025T163000');
    expect(ics).toContain('UID:2026-10-25-tocht@scoutsvosselaar.be');
    expect(ics).toContain('X-WR-CALNAME:Scouts Vosselaar');
  });

  it('gives the right instants around the switch to winter and summer time', () => {
    const [before, after, spring] = parse(
      calendar([
        event({ id: 'a', start: d('2026-10-24T14:00'), end: null }),
        event({ id: 'b', start: d('2026-10-25T14:00'), end: null }),
        event({ id: 'c', start: d('2027-03-28T14:00'), end: null }),
      ]),
    );
    expect(before!.startDate.toJSDate().toISOString()).toBe('2026-10-24T12:00:00.000Z');
    expect(after!.startDate.toJSDate().toISOString()).toBe('2026-10-25T13:00:00.000Z');
    expect(spring!.startDate.toJSDate().toISOString()).toBe('2027-03-28T12:00:00.000Z');
  });

  it('writes all-day events as dates with an exclusive end', () => {
    const ics = calendar([event({ id: 'w', allDay: true, start: d('2026-12-05'), end: d('2026-12-06') })]);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261205');
    expect(ics).toContain('DTEND;VALUE=DATE:20261207');
    const [w] = parse(ics);
    expect(w!.startDate.isDate).toBe(true);
  });

  it('marks cancelled events', () => {
    const ics = calendar([event({ cancelled: true })]);
    expect(ics).toContain('STATUS:CANCELLED');
    expect(ics).toContain('Dit evenement is geannuleerd.');
  });

  it('puts price, link and page in the description', () => {
    const [e] = parse(calendar([event({ price: '€12', link: { url: 'https://forms.gle/x', label: 'Inschrijven' }, description: 'Neem een gamel mee.' })]));
    expect(e!.description).toBe('Neem een gamel mee.\n\nPrijs: €12\n\nInschrijven: https://forms.gle/x\n\nMeer info: https://scoutsvosselaar.be/kalender/2026-10-25-tocht/');
  });

  it('gives the same file for the same content', () => {
    expect(calendar([event({})])).toBe(calendar([event({})]));
  });

  it('makes webcal links', () => {
    expect(webcalUrl('https://scoutsvosselaar.be/ics/alle.ics')).toBe('webcal://scoutsvosselaar.be/ics/alle.ics');
  });
});
