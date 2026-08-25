import type { CSSProperties } from 'react';
import type { Localized } from '../types';

/** Color tokens shown in the Design System view. `tw` is the closest Tailwind name. */
export const COLOR_TOKENS: { name: string; hex: string; tw: string; use: Localized }[] = [
  { name: 'bg / base', hex: '#020617', tw: 'slate-950', use: { es: 'Fondo de la app', en: 'App background' } },
  { name: 'bg / raised', hex: '#0b1220', tw: 'slate-950+', use: { es: 'Barra lateral, campos', en: 'Sidebar, inputs' } },
  { name: 'surface', hex: '#0f172a', tw: 'slate-900', use: { es: 'Tarjetas y paneles', en: 'Cards and panels' } },
  { name: 'border', hex: '#1e293b', tw: 'slate-800', use: { es: 'Bordes de 1px', en: '1px borders' } },
  { name: 'text / primary', hex: '#f1f5f9', tw: 'slate-100', use: { es: 'Títulos', en: 'Headings' } },
  { name: 'text / body', hex: '#cbd5e1', tw: 'slate-300', use: { es: 'Texto de lectura', en: 'Reading text' } },
  { name: 'text / muted', hex: '#64748b', tw: 'slate-500', use: { es: 'Etiquetas, metadatos', en: 'Labels, metadata' } },
  { name: 'accent / active', hex: '#34d399', tw: 'emerald-400', use: { es: 'Activo, ingresos, saldo', en: 'Active, income, balance' } },
  { name: 'accent / brand', hex: '#8b5cf6', tw: 'violet-500', use: { es: 'Marca, navegación activa', en: 'Brand, active nav' } },
  { name: 'accent / warn', hex: '#fbbf24', tw: 'amber-400', use: { es: 'Reagendado, atención', en: 'Rescheduled, attention' } },
  { name: 'accent / danger', hex: '#f43f5e', tw: 'rose-500', use: { es: 'Cancelado, muy atrasado', en: 'Cancelled, very stale' } },
  { name: 'accent / info', hex: '#38bdf8', tw: 'sky-400', use: { es: 'Ensayo de estudio', en: 'Studio practice' } },
];

export interface TypeScaleRow {
  name: string;
  px: string;
  sample: string;
  style: CSSProperties;
}

export const TYPE_SCALE: TypeScaleRow[] = [
  { name: 'Display / Space Grotesk 600', px: '19–22px', sample: 'Festival Latino de Fruitvale', style: { font: "600 19px 'Space Grotesk',sans-serif", color: '#f1f5f9', letterSpacing: '-.015em' } },
  { name: 'Section / Space Grotesk 600', px: '11px · .12em', sample: 'FONDO COMÚN', style: { font: "600 11px 'Space Grotesk',sans-serif", letterSpacing: '.12em', textTransform: 'uppercase', color: '#64748b' } },
  { name: 'Body / IBM Plex Sans 400', px: '14px', sample: 'Set de 45 min. Llegar 17:30 para prueba de sonido.', style: { font: "400 14px 'IBM Plex Sans',sans-serif", color: '#cbd5e1' } },
  { name: 'Meta / IBM Plex Sans 500', px: '12.5px', sample: 'Hayward, CA · 5 confirmados', style: { font: "500 12.5px 'IBM Plex Sans',sans-serif", color: '#64748b' } },
  { name: 'Numeric / IBM Plex Mono 600', px: '22px', sample: '$1,112.70', style: { font: "600 22px 'IBM Plex Mono',monospace", color: '#34d399' } },
];

/** Handoff notes for Phase 2. `%STALE%` is replaced with the current staleDays knob. */
export const HANDOFF_NOTES: { h: Localized; items: Localized[] }[] = [
  { h: { es: 'Stack de Fase 2', en: 'Phase 2 stack' }, items: [
    { es: 'Supabase free tier: Postgres + Auth (email/password, Google, Apple) + RLS. Sin Storage: todo media es un enlace externo.', en: 'Supabase free tier: Postgres + Auth (email/password, Google, Apple) + RLS. No Storage: all media is an external link.' },
    { es: 'Frontend: React + Tailwind. Los tokens de la pestaña Sistema mapean 1:1 a la escala slate/emerald/violet/amber de Tailwind.', en: 'Frontend: React + Tailwind. The tokens in the System tab map 1:1 to Tailwind slate/emerald/violet/amber.' },
  ] },
  { h: { es: 'Tablas sugeridas', en: 'Suggested tables' }, items: [
    { es: 'profiles(id, name, email, role, joined_at) · profile_instruments(profile_id, instrument, proficiency) · profile_vocals(profile_id, flag)', en: 'profiles(id, name, email, role, joined_at) · profile_instruments(profile_id, instrument, proficiency) · profile_vocals(profile_id, flag)' },
    { es: 'songs(id, title, genre, key, bpm, duration, chart_url, youtube_url, spotify_url, recording_url, last_rehearsed_at)', en: 'songs(id, title, genre, key, bpm, duration, chart_url, youtube_url, spotify_url, recording_url, last_rehearsed_at)' },
    { es: 'events(id, type, state, starts_at, venue, fee_cents, flyer_url, note, previous_starts_at) · event_songs(event_id, song_id, position)', en: 'events(id, type, state, starts_at, venue, fee_cents, flyer_url, note, previous_starts_at) · event_songs(event_id, song_id, position)' },
    { es: 'event_media(event_id, label, url, submitted_by) · feedback(event_id, profile_id, anonymous, sound, performance, logistics, energy, went_well, improve)', en: 'event_media(event_id, label, url, submitted_by) · feedback(event_id, profile_id, anonymous, sound, performance, logistics, energy, went_well, improve)' },
    { es: 'polls(event_id, question) · poll_options(poll_id, label) · poll_votes(option_id, profile_id)', en: 'polls(event_id, question) · poll_options(poll_id, label) · poll_votes(option_id, profile_id)' },
    { es: 'transactions(id, kind, amount_cents, occurred_on, description, proof_url, proof_kind, created_by, event_id, gear_id)', en: 'transactions(id, kind, amount_cents, occurred_on, description, proof_url, proof_kind, created_by, event_id, gear_id)' },
    { es: 'gear(id, name, cost_cents, purchased_on, custodian_id, condition, note) · gear_custody_log(gear_id, from_id, to_id, at)', en: 'gear(id, name, cost_cents, purchased_on, custodian_id, condition, note) · gear_custody_log(gear_id, from_id, to_id, at)' },
    { es: 'threads(id, author_id, title, body) · thread_votes(thread_id, profile_id) · thread_comments(thread_id, author_id, body)', en: 'threads(id, author_id, title, body) · thread_votes(thread_id, profile_id) · thread_comments(thread_id, author_id, body)' },
  ] },
  { h: { es: 'Lógica derivada, no almacenada', en: 'Derived, not stored' }, items: [
    { es: 'Historial: events donde starts_at < now(). No hay campo "archived".', en: 'History: events where starts_at < now(). There is no "archived" column.' },
    { es: 'last_rehearsed_at de cada canción se recalcula del último event_songs con evento pasado.', en: "Each song's last_rehearsed_at recomputes from the latest event_songs on a past event." },
    { es: 'Umbral de "sin ensayar" configurable (tweak staleDays, hoy %STALE% días). Amarillo > umbral, rojo > 90 días.', en: '"Unrehearsed" threshold is configurable (staleDays tweak, currently %STALE% days). Amber over threshold, red over 90 days.' },
    { es: 'Saldo del fondo = suma de ingresos − egresos. Nunca se guarda un total.', en: 'Pool balance = sum of income − expenses. Never store a total.' },
  ] },
  { h: { es: 'Permisos (RLS)', en: 'Permissions (RLS)' }, items: [
    { es: 'Admin: escritura en events, songs, transactions, gear, polls; puede convertir ideas en eventos.', en: 'Admin: write on events, songs, transactions, gear, polls; can convert ideas into events.' },
    { es: 'Músico: lectura global de calendario y fondo; escritura en su perfil, feedback, media links, threads y comentarios.', en: 'Member: global read on calendar and ledger; write on own profile, feedback, media links, threads and comments.' },
    { es: 'La transparencia del fondo es intencional: todos los miembros leen todos los movimientos y comprobantes.', en: 'Ledger transparency is intentional: every member reads every movement and proof link.' },
  ] },
  { h: { es: 'Simulado en este prototipo', en: 'Mocked in this prototype' }, items: [
    { es: 'Los enlaces de Drive / iCloud / Docs son ficticios y no resuelven. Reemplazar por URLs reales.', en: 'Drive / iCloud / Docs links are fictional and do not resolve. Replace with real URLs.' },
    { es: 'navigator.share y el deep link instagram://camera se intentan de verdad; en escritorio caen a un aviso.', en: 'navigator.share and the instagram://camera deep link are genuinely attempted; on desktop they fall back to a toast.' },
    { es: 'Los formularios de nuevo evento / canción / movimiento sí insertan en el estado local, sin persistencia.', en: 'The new event / song / movement forms do insert into local state, with no persistence.' },
    { es: 'Auth, OAuth y recuperación de contraseña no están en Fase 1.', en: 'Auth, OAuth and password recovery are out of scope for Phase 1.' },
  ] },
];

export const TOUR_STEPS: { title: Localized; body: Localized }[] = [
  { title: { es: 'Bienvenido a BandSync', en: 'Welcome to BandSync' }, body: { es: 'Prototipo de Fase 1 con datos ficticios pero realistas: 24 canciones, 11 eventos, 13 movimientos del fondo y 6 equipos.', en: 'Phase 1 prototype with fictional but realistic data: 24 songs, 11 events, 13 ledger movements and 6 pieces of gear.' } },
  { title: { es: 'Cambia de rol en vivo', en: 'Flip roles live' }, body: { es: 'El botón de rol en la barra superior alterna Admin y Músico. Los controles de escritura desaparecen para el músico.', en: 'The role button in the top bar toggles Admin and Band member. Write controls disappear for members.' } },
  { title: { es: 'Todo en dos idiomas', en: 'Everything in two languages' }, body: { es: 'ES / EN cambia la interfaz completa, incluidas fechas, leyendas de Instagram y notas de eventos.', en: 'ES / EN switches the whole interface, including dates, Instagram captions and event notes.' } },
  { title: { es: 'Vista móvil y ⌘K', en: 'Mobile view and ⌘K' }, body: { es: 'El icono de teléfono abre la vista móvil con el flujo de Instagram. ⌘K abre la paleta de comandos.', en: 'The phone icon opens the mobile view with the Instagram flow. ⌘K opens the command palette.' } },
];
