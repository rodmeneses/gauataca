import { slug } from './format';

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

export function buildIcs(e: IcsEvent): string {
  const [y, m, day] = e.date.split('-').map(Number);
  const [hh, mm] = e.time.split(':').map(Number);
  const start = new Date(y, m - 1, day, hh || 0, mm || 0);
  const end = new Date(start.getTime() + (e.hours && e.hours > 0 ? e.hours : DEFAULT_HOURS) * 3600000);

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GUATACA//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
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
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Triggers a browser download of the event as an .ics file. */
export function downloadIcs(e: IcsEvent): void {
  const blob = new Blob([buildIcs(e)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug(e.title) || 'event'}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
