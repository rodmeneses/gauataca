/**
 * User-facing release notes, newest first. The first entry IS the app version:
 * add a new entry (and bump package.json to match — a test enforces it) for every
 * release worth telling the band about. Members who last saw an older version get
 * the unseen entries in a "What's new" dialog on their next load.
 */
import type { Localized } from '../types';

export interface ChangelogEntry {
  version: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  title: Localized;
  changes: Localized[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '0.2.0',
    date: '2026-09-24',
    title: { es: 'Foro más completo y botones unificados', en: 'A fuller forum and unified buttons' },
    changes: [
      { es: 'Novedades: ahora puedes ver este historial de cambios y se abre solo cuando hay una versión nueva.', en: "What's new: you can now see this changelog, and it opens by itself after a new version." },
      { es: 'Todos los botones de "crear" (evento, tema, canción, movimiento, equipo) tienen el mismo estilo.', en: 'Every "create" button (event, topic, song, transaction, gear) now looks the same.' },
      { es: 'Desliza hacia abajo para actualizar en el móvil.', en: 'Pull down to refresh on mobile.' },
      { es: 'Ideas con encuestas, fijar y archivar; ves quién dio like o dislike.', en: 'Ideas support polls, pinning and archiving; you can see who liked or disliked.' },
      { es: 'Agrega un evento a tu calendario (.ics) desde el detalle del evento.', en: 'Add an event to your calendar (.ics) from the event details.' },
      { es: 'Búsqueda global en eventos, canciones, fondo y foro.', en: 'Global search across events, songs, fund and forum.' },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-09-17',
    title: { es: 'Primera versión', en: 'First release' },
    changes: [
      { es: 'Foro de ideas con comentarios y reacciones.', en: 'Ideas forum with comments and reactions.' },
      { es: 'Notificaciones push.', en: 'Push notifications.' },
      { es: 'Fotos y videos en eventos, con carrusel.', en: 'Event photos and videos, with a carousel.' },
      { es: 'Enlaces directos a eventos, canciones y movimientos.', en: 'Shareable links to events, songs and ledger movements.' },
    ],
  },
];

export const APP_VERSION = CHANGELOG[0].version;

/**
 * Entries newer than `seen` (the last version the user acknowledged), newest first.
 * An unknown `seen` value yields just the latest entry rather than the whole history.
 */
export function entriesSince(seen: string | null, log: ChangelogEntry[] = CHANGELOG): ChangelogEntry[] {
  if (seen === null) return [];
  const i = log.findIndex((e) => e.version === seen);
  return i === -1 ? log.slice(0, 1) : log.slice(0, i);
}
