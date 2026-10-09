import { slug } from './format';
import { buildIcs, type IcsEvent } from './icsFeed';

export { buildIcs, buildIcsFeed, type IcsEvent } from './icsFeed';

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
