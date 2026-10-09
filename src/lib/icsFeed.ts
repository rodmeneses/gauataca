/**
 * iCalendar builders. Dependency-free on purpose: `api/calendar.ts` (a Node ESM
 * serverless function) imports this file directly.
 */
export interface IcsEvent {
  id: string;
  title: string;
  venue: string;
  note: string;
  /** ISO date "YYYY-MM-DD". */
  date: string;
  /** "HH:mm". */
  time: string;
  /** Duration in hours; falls back to DEFAULT_HOURS. */
  hours?: number;
  cancelled?: boolean;
}

const DEFAULT_HOURS = 2;

const pad = (n: number) => String(n).padStart(2, '0');

/** Floating local time ("YYYYMMDDTHHmmss", no zone) — events carry no timezone. */
function local(dt: Date): string {
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
}

function utcStamp(dt: Date): string {
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}${pad(dt.getUTCSeconds())}Z`;
}

/** RFC 5545 TEXT escaping. */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Fold to <= 75 chars per line (continuation lines start with a space). */
function fold(line: string): string {
  const parts: string[] = [];
  let rest = line;
  while (rest.length > 75) {
    parts.push(rest.slice(0, 75));
    rest = ' ' + rest.slice(75);
  }
  parts.push(rest);
  return parts.join('\r\n');
}

const CAL_HEADER = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GUATACA//Events//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];

function vevent(e: IcsEvent): string[] {
  const [y, m, day] = e.date.split('-').map(Number);
  const [hh, mm] = e.time.split(':').map(Number);
  const start = new Date(y, m - 1, day, hh || 0, mm || 0);
  const end = new Date(start.getTime() + (e.hours && e.hours > 0 ? e.hours : DEFAULT_HOURS) * 3600000);

  const lines = [
    'BEGIN:VEVENT',
    `UID:${e.id}@gauataca.vercel.app`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${local(start)}`,
    `DTEND:${local(end)}`,
    `SUMMARY:${esc(e.title)}`,
  ];
  if (e.venue) lines.push(`LOCATION:${esc(e.venue)}`);
  if (e.note) lines.push(`DESCRIPTION:${esc(e.note)}`);
  if (e.cancelled) lines.push('STATUS:CANCELLED');
  lines.push('END:VEVENT');
  return lines;
}

const serialize = (lines: string[]) => lines.map(fold).join('\r\n') + '\r\n';

export function buildIcs(e: IcsEvent): string {
  return serialize([...CAL_HEADER, ...vevent(e), 'END:VCALENDAR']);
}

/** A whole calendar (for a subscribable feed); `name` shows as the calendar's title. */
export function buildIcsFeed(events: IcsEvent[], name: string): string {
  return serialize([...CAL_HEADER, `X-WR-CALNAME:${esc(name)}`, ...events.flatMap(vevent), 'END:VCALENDAR']);
}
