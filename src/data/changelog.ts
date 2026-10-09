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
      { es: 'El idioma de la página ahora se actualiza al cambiar entre español e inglés (mejora lectores de pantalla y traducción automática).', en: 'The page language now updates when you switch between Spanish and English (better for screen readers and auto-translate).' },
      { es: 'La búsqueda general ahora también encuentra encuestas y enlaces (además de ideas y sus respuestas).', en: 'Global search now also finds polls and links (in addition to ideas and their replies).' },
      { es: 'Nueva sección de Enlaces para carpetas, listas y chats del grupo, con botón para copiar cada enlace. En el móvil, tu perfil ahora está en el avatar de arriba.', en: 'New Links section for the band\'s folders, playlists and chats, with a button to copy each link. On mobile, your profile is now behind the avatar at the top.' },
      { es: 'Novedades: ahora puedes ver este historial de cambios y se abre solo cuando hay una versión nueva.', en: "What's new: you can now see this changelog, and it opens by itself after a new version." },
      { es: 'Desliza hacia abajo para actualizar en el móvil.', en: 'Pull down to refresh on mobile.' },
      { es: 'Todos los botones de "crear" (evento, tema, canción, movimiento, equipo) tienen el mismo estilo.', en: 'Every "create" button (event, topic, song, transaction, gear) now looks the same.' },
      { es: 'Ideas ahora es un foro: temas, comentarios, reacciones, y botón "Ver detalles" para abrir cada hilo.', en: 'Ideas is now a forum: topics, comments, reactions, and a "View details" button to open each thread.' },
      { es: 'Encuestas en las ideas del foro.', en: 'Polls on forum ideas.' },
      { es: 'Crear encuestas es más claro: explicación, botón para quitarla, aviso si está incompleta y etiqueta "Encuesta" en las ideas.', en: 'Creating polls is clearer: a helper line, a remove button, a warning when incomplete, and a "Poll" label on ideas.' },
      { es: 'Las encuestas del foro pueden permitir elegir varias opciones.', en: 'Forum polls can allow picking multiple options.' },
      { es: 'Los admins pueden agregar opciones a una encuesta ya creada.', en: 'Admins can add options to a poll after it is created.' },
      { es: 'Puedes quitar tu voto en una encuesta tocando de nuevo la opción elegida.', en: 'You can remove your poll vote by tapping your chosen option again.' },
      { es: 'Fija eventos e ideas, y archiva ideas del foro.', en: 'Pin events and ideas, and archive forum ideas.' },
      { es: 'Ves quién dio like o dislike a ideas y comentarios.', en: 'See who liked or disliked ideas and comments.' },
      { es: 'Borra tus propios comentarios; los saltos de línea se respetan.', en: 'Delete your own comments; line breaks are preserved.' },
      { es: 'Notificaciones push, incluido cuando alguien da like a tu idea o comentario.', en: 'Push notifications, including when someone likes your idea or comment.' },
      { es: 'Búsqueda global en eventos, canciones, fondo y foro (móvil).', en: 'Global search across events, songs, fund and forum (mobile).' },
      { es: 'Agrega un evento a tu calendario (.ics) desde el detalle del evento.', en: 'Add an event to your calendar (.ics) from the event details.' },
      { es: 'Botones para copiar el enlace de cada idea y respuesta del foro.', en: 'Copy-link buttons for each forum idea and reply.' },
      { es: 'Los textos del foro admiten formato Markdown (títulos, negrita, cursiva y listas).', en: 'Forum posts and replies support Markdown (headings, bold, italics and lists).' },
      { es: '"Preparar para Instagram" ahora aparece arriba en el detalle del evento.', en: '"Prepare for Instagram" now appears near the top of the event details.' },
      { es: 'Los enlaces directos se conservan al iniciar sesión con Google, y en el móvil abren la pestaña correcta.', en: 'Shared links survive Google sign-in, and on mobile they open the right tab.' },
      { es: 'Textos corregidos ("1 día", "1 comentario", "Lugar"), eventos cancelados atenuados y "Sin voz" en miembros sin registro vocal.', en: 'Text fixes ("1 day", "1 comment", "Venue"), dimmed cancelled events, and a "No voice" label for members without vocal info.' },
      { es: 'Botones más grandes y fáciles de tocar en el móvil.', en: 'Bigger, easier-to-tap buttons on mobile.' },
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
