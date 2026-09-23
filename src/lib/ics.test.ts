import { describe, it, expect } from 'vitest';
import { buildIcs } from './ics';

const base = { id: 'ev1', title: 'Gig, Bar; Café', venue: 'El Patio', note: 'Line 1\nLine 2', date: '2026-09-12', time: '20:30', hours: 2.5 };

describe('buildIcs', () => {
  it('emits a floating-time VEVENT with start and end', () => {
    const ics = buildIcs(base);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('UID:ev1@gauataca.vercel.app');
    expect(ics).toContain('DTSTART:20260912T203000');
    expect(ics).toContain('DTEND:20260912T230000');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('escapes commas, semicolons and newlines', () => {
    const ics = buildIcs(base);
    expect(ics).toContain('SUMMARY:Gig\\, Bar\\; Café');
    expect(ics).toContain('DESCRIPTION:Line 1\\nLine 2');
  });

  it('defaults to 2h when no duration is set', () => {
    expect(buildIcs({ ...base, hours: undefined })).toContain('DTEND:20260912T223000');
  });

  it('rolls the end over midnight', () => {
    expect(buildIcs({ ...base, time: '23:00', hours: 3 })).toContain('DTEND:20260913T020000');
  });

  it('omits empty location/description and marks cancelled events', () => {
    const ics = buildIcs({ ...base, venue: '', note: '', cancelled: true });
    expect(ics).not.toContain('LOCATION');
    expect(ics).not.toContain('DESCRIPTION');
    expect(ics).toContain('STATUS:CANCELLED');
  });

  it('folds lines longer than 75 chars', () => {
    const ics = buildIcs({ ...base, note: 'x'.repeat(200) });
    expect(ics.split('\r\n').every((l) => l.length <= 75)).toBe(true);
  });
});
