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
    date: '2026-09-25',
    title: { es: 'Foro, notificaciones y búsqueda', en: 'Forum, notifications and search' },
    changes: [
      { es: 'Novedades: ahora puedes ver este historial de cambios y se abre solo cuando hay una versión nueva.', en: "What's new: you can now see this changelog, and it opens by itself after a new version." },
      { es: 'Desliza hacia abajo para actualizar en el móvil.', en: 'Pull down to refresh on mobile.' },
      { es: 'Todos los botones de "crear" (evento, tema, canción, movimiento, equipo) tienen el mismo estilo.', en: 'Every "create" button (event, topic, song, transaction, gear) now looks the same.' },
      { es: 'Ideas ahora es un foro: temas, comentarios, reacciones, y botón "Ver detalles" para abrir cada hilo.', en: 'Ideas is now a forum: topics, comments, reactions, and a "View details" button to open each thread.' },
      { es: 'Encuestas en las ideas del foro.', en: 'Polls on forum ideas.' },
      { es: 'Fija eventos e ideas, y archiva ideas del foro.', en: 'Pin events and ideas, and archive forum ideas.' },
      { es: 'Ves quién dio like o dislike a ideas y comentarios.', en: 'See who liked or disliked ideas and comments.' },
      { es: 'Borra tus propios comentarios; los saltos de línea se respetan.', en: 'Delete your own comments; line breaks are preserved.' },
      { es: 'Notificaciones push, incluido cuando alguien da like a tu idea o comentario.', en: 'Push notifications, including when someone likes your idea or comment.' },
      { es: 'Búsqueda global en eventos, canciones, fondo y foro (móvil).', en: 'Global search across events, songs, fund and forum (mobile).' },
      { es: 'Agrega un evento a tu calendario (.ics) desde el detalle del evento.', en: 'Add an event to your calendar (.ics) from the event details.' },
      { es: 'Confirmación antes de borrar tomas, fotos/videos de eventos y movimientos del fondo.', en: 'Confirmation before deleting takes, event media and ledger movements.' },
      { es: 'Botón de inicio de sesión con el logo de Google.', en: 'Sign-in button now uses the Google logo.' },
      { es: 'El carrusel de fotos respeta el área segura en la parte superior.', en: 'The photo carousel respects the top safe area.' },
    ],
  },
  {
    version: '0.1.0',
    date: '2026-09-14',
    title: { es: 'Primera versión', en: 'First release' },
    changes: [
      { es: 'Eventos, repertorio, setlists y fondo de la banda.', en: 'Band events, repertoire, setlists and fund.' },
      { es: 'Diseño adaptable a móvil y escritorio, con tema claro y oscuro.', en: 'Responsive design for mobile and desktop, with light and dark themes.' },
      { es: 'Instalable como app (PWA), con la bandera de Venezuela como marca.', en: 'Installable as an app (PWA), with the Venezuelan flag as the brand mark.' },
      { es: 'Edita eventos, agrega géneros; los saldos negativos se ven en rojo.', en: 'Edit events, add genres; negative balances show in red.' },
      { es: 'Los datos se actualizan solos tras cada cambio, con avisos más claros.', en: 'Data refreshes silently after each change, with clearer toasts.' },
      { es: 'Edita y borra movimientos del fondo; los montos de eventos liquidados se sincronizan.', en: 'Edit and delete ledger movements; settled event amounts stay in sync.' },
      { es: 'Categoría de ingreso DTV; "Cachet" ahora se llama "Honorarios"; las donaciones cuentan en las contribuciones.', en: 'DTV income category; "Cachet" is now "Honorarios"; donations count toward member contributions.' },
      { es: 'La fecha de "último ensayo" se calcula con los eventos confirmados.', en: 'The "last rehearsed" date is derived from confirmed events.' },
      { es: 'Enlaces directos a eventos, canciones y movimientos.', en: 'Shareable links to events, songs and ledger movements.' },
      { es: 'Fotos y videos en eventos, con vista previa en la tarjeta, subida múltiple y carrusel a pantalla completa.', en: 'Event photos and videos, with a tile preview, multi-upload and a full-screen carousel.' },
      { es: 'Enlace de metrónomo en las canciones.', en: 'Metronome link on songs.' },
      { es: 'Toca el grupo de RSVP para ver los nombres completos.', en: 'Tap an RSVP group to see full attendee names.' },
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
