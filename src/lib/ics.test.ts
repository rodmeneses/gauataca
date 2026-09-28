import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildIcs, downloadIcs } from './ics';

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

  it('treats a midnight start hour/minute as 0, not a parse failure', () => {
    expect(buildIcs({ ...base, time: '00:00' })).toContain('DTSTART:20260912T000000');
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

describe('downloadIcs', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('creates an object URL, clicks a download link, then revokes it', () => {
    vi.useFakeTimers();
    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadIcs(base);

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    clickSpy.mockRestore();
  });

  it('falls back to "event" as the filename when the title has no sluggable characters', () => {
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn().mockReturnValue('blob:mock-url'), revokeObjectURL: vi.fn() });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('event.ics');
    });

    downloadIcs({ ...base, title: '¡¡¡!!!' });

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });
});
