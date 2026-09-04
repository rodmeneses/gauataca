-- BandSync — seed data (Flyway repeatable migration)
-- Idempotent (on conflict do nothing). Mirrors src/data/*.ts. Demo members use
-- fixed UUIDs; money is in cents; localized fields are _es/_en pairs; timestamps are UTC.

-- ---------------------------------------------------------------------------
-- Profiles (5 demo members + the existing real user)
-- ---------------------------------------------------------------------------
insert into profiles (id, name, email, role, title_es, title_en, joined_at) values
  ('11111111-1111-1111-1111-111111111111', 'Rodrigo Alcántara', 'rodrigo@dulcetricolor.org', 'admin', 'Director musical', 'Musical director', '2023-04-11T00:00:00Z'),
  ('22222222-2222-2222-2222-222222222222', 'Caro Betancourt', 'caro@dulcetricolor.org', 'member', 'Voz principal', 'Lead voice', '2023-04-11T00:00:00Z'),
  ('33333333-3333-3333-3333-333333333333', 'Diego Salazar', 'diego@dulcetricolor.org', 'admin', 'Tesorero', 'Treasurer', '2023-06-02T00:00:00Z'),
  ('44444444-4444-4444-4444-444444444444', 'Sofía Uzcátegui', 'sofia@dulcetricolor.org', 'member', 'Percusión', 'Percussion', '2024-01-19T00:00:00Z'),
  ('55555555-5555-5555-5555-555555555555', 'Abi Contreras', 'abi@dulcetricolor.org', 'member', 'Guitarra', 'Guitar', '2024-09-07T00:00:00Z'),
  ('ce044361-93d2-4ac1-9111-30788790ac3c', 'Rodrigo', 'rmeneses@gmail.com', 'admin', null, null, '2026-08-30T22:27:03.745008+00:00')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Instrument catalog (5 basic + 4 custom used by the demo members)
-- ---------------------------------------------------------------------------
insert into instruments (id, name_es, name_en, is_basic) values
  ('cuatro', 'Cuatro', 'Cuatro', true),
  ('guitarra', 'Guitarra', 'Guitar', true),
  ('bajo', 'Bajo', 'Bass', true),
  ('piano', 'Piano', 'Piano', true),
  ('percusion', 'Percusión', 'Percussion', true),
  ('arpa', 'Arpa llanera', 'Llanera harp', false),
  ('voz', 'Voz principal', 'Lead vocals', false),
  ('tambores', 'Tambores culo''e puya', 'Culo''e puya drums', false),
  ('furruco', 'Furruco', 'Furruco', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Profile instruments / vocals
-- ---------------------------------------------------------------------------
insert into profile_instruments (profile_id, instrument_id, proficiency) values
  ('11111111-1111-1111-1111-111111111111', 'arpa', 'expert'),
  ('11111111-1111-1111-1111-111111111111', 'cuatro', 'inter'),
  ('22222222-2222-2222-2222-222222222222', 'voz', 'expert'),
  ('22222222-2222-2222-2222-222222222222', 'cuatro', 'beg'),
  ('33333333-3333-3333-3333-333333333333', 'cuatro', 'expert'),
  ('33333333-3333-3333-3333-333333333333', 'guitarra', 'inter'),
  ('44444444-4444-4444-4444-444444444444', 'tambores', 'expert'),
  ('44444444-4444-4444-4444-444444444444', 'furruco', 'inter'),
  ('55555555-5555-5555-5555-555555555555', 'guitarra', 'expert'),
  ('55555555-5555-5555-5555-555555555555', 'cuatro', 'inter')
on conflict do nothing;

insert into profile_vocals (profile_id, flag) values
  ('11111111-1111-1111-1111-111111111111', 'none'),
  ('22222222-2222-2222-2222-222222222222', 'lead'),
  ('22222222-2222-2222-2222-222222222222', 'chorus'),
  ('33333333-3333-3333-3333-333333333333', 'chorus'),
  ('44444444-4444-4444-4444-444444444444', 'chorus'),
  ('55555555-5555-5555-5555-555555555555', 'chorus')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Songs (24)
-- ---------------------------------------------------------------------------
insert into songs (id, title_es, title_en, genre, key, bpm, duration, last_rehearsed_at) values
  ('s1', 'Alma Llanera', 'Alma Llanera', 'joropo', 'Em', 184, '3:52', '2026-08-15'),
  ('s2', 'Pajarillo', 'Pajarillo', 'joropo', 'Am', 212, '5:10', '2026-08-15'),
  ('s3', 'Seis por Derecho', 'Seis por Derecho', 'joropo', 'D', 224, '4:05', '2026-07-18'),
  ('s4', 'Quirpa', 'Quirpa', 'joropo', 'Am', 208, '3:40', '2026-08-08'),
  ('s5', 'Zumba que Zumba', 'Zumba que Zumba', 'joropo', 'Em', 200, '3:15', '2026-06-20'),
  ('s6', 'Carmentea', 'Carmentea', 'joropo', 'G', 196, '3:28', '2026-08-08'),
  ('s7', 'El Gavilán', 'El Gavilán', 'joropo', 'Dm', 216, '4:44', '2026-05-30'),
  ('s8', 'Concierto en la Llanura', 'Concierto en la Llanura', 'joropo', 'Am', 190, '4:20', '2026-08-15'),
  ('s9', 'Caballo Viejo', 'Caballo Viejo', 'llanera', 'Am', 122, '4:12', '2026-08-15'),
  ('s10', 'Tonada de Luna Llena', 'Tonada de Luna Llena', 'llanera', 'Dm', 68, '3:30', '2026-08-08'),
  ('s11', 'Sabana', 'Sabana', 'llanera', 'F', 96, '4:02', '2026-07-26'),
  ('s12', 'Mi Querencia', 'Mi Querencia', 'llanera', 'G', 88, '3:44', '2026-06-14'),
  ('s13', 'La Vaca Mariposa', 'La Vaca Mariposa', 'llanera', 'C', 132, '2:58', '2026-08-08'),
  ('s14', 'Sentir Zuliano', 'Sentir Zuliano', 'gaita', 'Am', 138, '3:20', '2025-12-20'),
  ('s15', 'La Grey Zuliana', 'La Grey Zuliana', 'gaita', 'Dm', 142, '3:35', '2025-12-20'),
  ('s16', 'Amparito', 'Amparito', 'gaita', 'G', 136, '3:10', '2025-12-14'),
  ('s17', 'Ronda Antañona', 'Ronda Antañona', 'gaita', 'C', 130, '3:26', '2025-12-14'),
  ('s18', 'Maracaibo en la Noche', 'Maracaibo en la Noche', 'gaita', 'Em', 134, '3:48', '2025-12-06'),
  ('s19', 'San Juan Todo lo Tiene', 'San Juan Todo lo Tiene', 'tambor', 'Dm', 108, '5:30', '2026-06-24'),
  ('s20', 'Malembe', 'Malembe', 'tambor', 'Am', 100, '4:50', '2026-06-24'),
  ('s21', 'Sangueo de Curiepe', 'Sangueo de Curiepe', 'tambor', 'Em', 104, '6:10', '2026-07-18'),
  ('s22', 'Calipso del Callao', 'Calipso del Callao', 'calipso', 'G', 118, '4:00', '2026-08-08'),
  ('s23', 'Guasipati', 'Guasipati', 'calipso', 'C', 116, '3:36', '2026-07-26'),
  ('s24', 'El Callao Suena', 'El Callao Suena', 'calipso', 'F', 120, '3:52', '2026-05-16')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Song → required instruments
-- ---------------------------------------------------------------------------
insert into song_instruments (song_id, instrument_id) values
  ('s1', 'arpa'), ('s1', 'cuatro'), ('s1', 'tambores'),
  ('s2', 'arpa'), ('s2', 'cuatro'),
  ('s9', 'arpa'), ('s9', 'cuatro'),
  ('s14', 'furruco'), ('s14', 'cuatro'), ('s14', 'tambores'),
  ('s19', 'tambores'), ('s19', 'cuatro'),
  ('s22', 'cuatro'), ('s22', 'percusion')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Song links (streaming + tabs/sheet music — several per song, tagged by kind)
-- ---------------------------------------------------------------------------
insert into song_links (id, song_id, kind, label_es, label_en, url, position) values
  (1, 's1', 'chart', 'Partitura (Google Docs)', 'Chart (Google Docs)', 'https://docs.google.com/document/d/dtv-alma-llanera', 1),
  (2, 's1', 'chart', 'Tabs de cuatro', 'Cuatro tabs', 'https://drive.google.com/file/d/dtv-alma-llanera-tabs', 2),
  (3, 's2', 'chart', 'Partitura (Google Docs)', 'Chart (Google Docs)', 'https://docs.google.com/document/d/dtv-pajarillo', 1),
  (4, 's9', 'chart', 'Partitura (Google Docs)', 'Chart (Google Docs)', 'https://docs.google.com/document/d/dtv-caballo-viejo', 1),
  (5, 's9', 'chart', 'Letra y acordes', 'Lyrics & chords', 'https://drive.google.com/file/d/dtv-caballo-viejo-chords', 2),
  (6, 's11', 'chart', 'Partitura (Google Docs)', 'Chart (Google Docs)', 'https://docs.google.com/document/d/dtv-sabana', 1),
  (7, 's11', 'chart', 'Tabs de arpa', 'Harp tabs', 'https://drive.google.com/file/d/dtv-sabana-harp', 2),
  (8, 's14', 'chart', 'Partitura (Google Docs)', 'Chart (Google Docs)', 'https://docs.google.com/document/d/dtv-sentir-zuliano', 1),
  (9, 's19', 'chart', 'Partitura (Google Docs)', 'Chart (Google Docs)', 'https://docs.google.com/document/d/dtv-san-juan', 1),
  (10, 's19', 'chart', 'Patrón de tambores', 'Drum pattern', 'https://drive.google.com/file/d/dtv-san-juan-drums', 2),
  (11, 's22', 'chart', 'Partitura (Google Docs)', 'Chart (Google Docs)', 'https://docs.google.com/document/d/dtv-calipso-callao', 1),
  (12, 's1', 'youtube', 'Video oficial', 'Official video', 'https://www.youtube.com/watch?v=dtv-alma-llanera', 1),
  (13, 's1', 'youtube', 'En vivo — Festival de Verano', 'Live — Summer Festival', 'https://www.youtube.com/watch?v=dtv-alma-llanera-live', 2),
  (14, 's9', 'youtube', 'Video oficial', 'Official video', 'https://www.youtube.com/watch?v=dtv-caballo-viejo', 1),
  (15, 's9', 'spotify', 'Spotify', 'Spotify', 'https://open.spotify.com/track/dtv-caballo-viejo', 1),
  (16, 's9', 'apple', 'Apple Music', 'Apple Music', 'https://music.apple.com/us/album/dtv-caballo-viejo', 1),
  (17, 's11', 'youtube', 'Video oficial', 'Official video', 'https://www.youtube.com/watch?v=dtv-sabana', 1),
  (18, 's11', 'spotify', 'Spotify', 'Spotify', 'https://open.spotify.com/track/dtv-sabana', 1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Events (11)
-- ---------------------------------------------------------------------------
insert into events (id, type, state, starts_at, duration_hours, venue, fee_cents, cost_cents, settled, attend, flyer_url, title_es, title_en, note_es, note_en, previous_starts_at) values
  ('e3', 'garage', 'active', '2026-08-27T16:00:00Z', 3, 'Hayward, CA', 0, 0, false, 5, null,
    'Ensayo en el garaje de Diego', 'Practice at Diego''s garage',
    'Arrancamos la temporada de gaitas temprano este año.', 'Starting gaita season early this year.', null),
  ('e2', 'studio', 'active', '2026-09-02T19:00:00Z', 2, 'San Leandro, CA', 0, 5000, false, 4, null,
    'Ensayo de estudio — Sonido Sur', 'Studio rehearsal — Sonido Sur',
    'Repaso del set del Festival Latino. Traer cables propios.', 'Run the Festival Latino set. Bring your own cables.', null),
  ('e1', 'gig', 'active', '2026-09-12T18:30:00Z', 2, 'Fruitvale Plaza, Oakland, CA', 60000, 0, false, 5, 'https://drive.google.com/file/d/dtv-flyer-fruitvale/view',
    'Festival Latino de Fruitvale', 'Fruitvale Latino Festival',
    'Set de 45 min. Llegar 17:30 para prueba de sonido.', '45-min set. Call time 5:30pm for soundcheck.', null),
  ('e5', 'gig', 'cancelled', '2026-09-19T19:30:00Z', null, 'San José, CA', 0, 0, false, 0, null,
    'Mercado Nocturno de San José', 'San José Night Market',
    'Cancelado: el permiso de vendedores no salió a tiempo.', 'Cancelled: vendor permit did not clear in time.', null),
  ('e4', 'gig', 'rescheduled', '2026-10-04T15:00:00Z', 3, 'Palo Alto, CA', 85000, 0, false, 4, null,
    'Boda Rivas — ceremonia y cóctel', 'Rivas wedding — ceremony & cocktail',
    'Movido una semana por la familia. Set acústico, sin percusión fuerte.', 'Moved a week at the family''s request. Acoustic set, light percussion.', '2026-09-27T15:00:00Z'),
  ('e6', 'gig', 'active', '2026-12-16T19:00:00Z', 2, 'Oakland, CA', 30000, 0, false, 5, null,
    'Misa de Aguinaldo — St. Elizabeth', 'Misa de Aguinaldo — St. Elizabeth',
    'Programa completo de gaitas. Revisar el furruco antes.', 'Full gaita program. Service the furruco first.', null),
  ('h1', 'gig', 'active', '2026-08-15T17:00:00Z', 3, 'Civic Center Park, Berkeley, CA', 45000, 0, true, 5, null,
    'Cierre del Festival de Verano', 'Summer Festival closing set',
    'Cachet de $450 más propinas. Mejor evento del año hasta ahora.', '$450 fee plus tips. Best event of the year so far.', null),
  ('h2', 'garage', 'active', '2026-08-08T16:00:00Z', 4, 'Hayward, CA', 0, 0, false, 4, null,
    'Ensayo en el garaje de Diego', 'Practice at Diego''s garage',
    'Cuatro horas. Cerramos los arreglos de calipso.', 'Four hours. Locked the calipso arrangements.', null),
  ('h3', 'studio', 'active', '2026-07-26T19:00:00Z', 2, 'San Leandro, CA', 0, 5000, true, 3, null,
    'Ensayo de estudio — Sonido Sur', 'Studio rehearsal — Sonido Sur',
    'Solo tres pudieron ir. Grabamos referencia de "Sabana".', 'Only three could make it. Tracked a "Sabana" reference.', null),
  ('h4', 'gig', 'active', '2026-07-18T12:00:00Z', 4, 'Berkeley, CA', 8600, 0, true, 4, null,
    'Ashby Flea Market', 'Ashby Flea Market',
    'Solo propinas: $86. Buen calentamiento de calle.', 'Tips only: $86. Good street warm-up.', null),
  ('h5', 'garage', 'active', '2026-06-24T16:00:00Z', 3, 'Hayward, CA', 0, 0, false, 5, null,
    'Ensayo en el garaje de Diego', 'Practice at Diego''s garage',
    'Sesión dedicada a tambores de Barlovento con Sofía.', 'Barlovento drum session led by Sofía.', null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Event setlists (event_songs)
-- ---------------------------------------------------------------------------
insert into event_songs (event_id, song_id, position) values
  ('e3', 's14', 1), ('e3', 's15', 2), ('e3', 's16', 3),
  ('e2', 's1', 1), ('e2', 's9', 2), ('e2', 's2', 3), ('e2', 's22', 4),
  ('e1', 's1', 1), ('e1', 's9', 2), ('e1', 's2', 3), ('e1', 's22', 4), ('e1', 's13', 5), ('e1', 's3', 6), ('e1', 's10', 7), ('e1', 's6', 8),
  ('e4', 's10', 1), ('e4', 's12', 2), ('e4', 's11', 3), ('e4', 's9', 4),
  ('e6', 's14', 1), ('e6', 's15', 2), ('e6', 's16', 3), ('e6', 's17', 4), ('e6', 's18', 5),
  ('h1', 's1', 1), ('h1', 's9', 2), ('h1', 's2', 3), ('h1', 's8', 4), ('h1', 's10', 5),
  ('h2', 's4', 1), ('h2', 's6', 2), ('h2', 's10', 3), ('h2', 's13', 4), ('h2', 's22', 5),
  ('h3', 's11', 1), ('h3', 's23', 2),
  ('h4', 's3', 1), ('h4', 's21', 2),
  ('h5', 's19', 1), ('h5', 's20', 2)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Event media
-- ---------------------------------------------------------------------------
insert into event_media (id, event_id, label_es, label_en, url, submitted_by) values
  (1, 'h1', 'Álbum compartido de iCloud — fotos', 'iCloud shared album — photos', 'https://www.icloud.com/sharedalbum/dtv-berkeley-2026', null),
  (2, 'h1', 'Carpeta de Drive — video del set', 'Drive folder — set video', 'https://drive.google.com/drive/folders/dtv-berkeley-video', null),
  (3, 'h4', 'Fotos del puesto — Drive', 'Booth photos — Drive', 'https://drive.google.com/drive/folders/dtv-ashby', null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Song recordings ("takes") on practice events
-- ---------------------------------------------------------------------------
insert into takes (id, event_id, song_id, url, n) values
  ('k1', 'h3', 's11', 'https://drive.google.com/file/d/dtv-sabana-take1', 1),
  ('k2', 'h3', 's11', 'https://drive.google.com/file/d/dtv-sabana-take2', 2),
  ('k3', 'h3', 's11', 'https://drive.google.com/file/d/dtv-sabana-take3', 3),
  ('k4', 'h2', 's4', 'https://drive.google.com/file/d/dtv-s4-take1', 1),
  ('k5', 'h2', 's6', 'https://drive.google.com/file/d/dtv-s6-take1', 1),
  ('k6', 'h5', 's19', 'https://drive.google.com/file/d/dtv-s19-take1', 1),
  ('k7', 'h5', 's20', 'https://drive.google.com/file/d/dtv-s20-take1', 1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Attendance (RSVP)
-- ---------------------------------------------------------------------------
insert into event_attendance (event_id, profile_id, status) values
  ('e3', '11111111-1111-1111-1111-111111111111', 'going'),
  ('e3', '22222222-2222-2222-2222-222222222222', 'going'),
  ('e3', '33333333-3333-3333-3333-333333333333', 'going'),
  ('e3', '44444444-4444-4444-4444-444444444444', 'maybe'),
  ('e2', '11111111-1111-1111-1111-111111111111', 'going'),
  ('e2', '22222222-2222-2222-2222-222222222222', 'going'),
  ('e2', '33333333-3333-3333-3333-333333333333', 'going'),
  ('e2', '44444444-4444-4444-4444-444444444444', 'no'),
  ('e2', '55555555-5555-5555-5555-555555555555', 'going'),
  ('e1', '11111111-1111-1111-1111-111111111111', 'going'),
  ('e1', '22222222-2222-2222-2222-222222222222', 'going'),
  ('e1', '33333333-3333-3333-3333-333333333333', 'going'),
  ('e1', '44444444-4444-4444-4444-444444444444', 'going'),
  ('e1', '55555555-5555-5555-5555-555555555555', 'maybe'),
  ('e4', '11111111-1111-1111-1111-111111111111', 'going'),
  ('e4', '22222222-2222-2222-2222-222222222222', 'going'),
  ('e4', '33333333-3333-3333-3333-333333333333', 'going'),
  ('e4', '44444444-4444-4444-4444-444444444444', 'no'),
  ('e4', '55555555-5555-5555-5555-555555555555', 'going'),
  ('e6', '11111111-1111-1111-1111-111111111111', 'going'),
  ('e6', '22222222-2222-2222-2222-222222222222', 'going'),
  ('e6', '33333333-3333-3333-3333-333333333333', 'maybe'),
  ('e6', '44444444-4444-4444-4444-444444444444', 'going')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Feedback (h1) — 5 rows that aggregate to the mock averages
-- ---------------------------------------------------------------------------
insert into feedback (event_id, profile_id, anonymous, sound, performance, logistics, energy, went_well_es, went_well_en, improve_es, improve_en) values
  ('h1', '11111111-1111-1111-1111-111111111111', false, 4, 4, 3, 5, null, null, null, null),
  ('h1', '22222222-2222-2222-2222-222222222222', false, 5, 5, 4, 5,
    'El público cantó "Alma Llanera" completa. Nunca nos había pasado.', 'The crowd sang all of "Alma Llanera". First time ever.', null, null),
  ('h1', '33333333-3333-3333-3333-333333333333', false, 4, 5, 3, 5, null, null,
    'Llegamos con 20 min para armar. Necesitamos una hora.', 'We only had 20 min to set up. We need a full hour.'),
  ('h1', '44444444-4444-4444-4444-444444444444', true, 4, 4, 4, 4,
    'El arpa se escuchó limpia por primera vez en un evento al aire libre.', 'The harp sounded clean outdoors for the first time.', null, null),
  ('h1', '55555555-5555-5555-5555-555555555555', true, 4, 5, 3, 5, null, null,
    'Faltó agua y sombra para el equipo.', 'No water or shade for the crew.')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Poll (h1) + options + votes
-- ---------------------------------------------------------------------------
insert into polls (id, event_id, question_es, question_en) values
  (1, 'h1', '¿Volvemos a tocar en el Festival de Verano el año que viene?', 'Should we play the Summer Festival again next year?')
on conflict (id) do nothing;

insert into poll_options (id, poll_id, label_es, label_en) values
  (1, 1, 'Sí, sin duda', 'Yes, definitely'),
  (2, 1, 'Solo si suben el cachet', 'Only for a higher fee'),
  (3, 1, 'No', 'No')
on conflict (id) do nothing;

insert into poll_votes (option_id, profile_id) values
  (1, '11111111-1111-1111-1111-111111111111'),
  (1, '22222222-2222-2222-2222-222222222222'),
  (1, '33333333-3333-3333-3333-333333333333'),
  (1, '44444444-4444-4444-4444-444444444444'),
  (2, '55555555-5555-5555-5555-555555555555')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Gear (6)
-- ---------------------------------------------------------------------------
insert into gear (id, name_es, name_en, cost_cents, purchased_on, custodian_id, condition, note_es, note_en, purchased_by) values
  ('g1', 'Mezcladora Behringer Xenyx Q1202USB', 'Behringer Xenyx Q1202USB mixer', 30500, '2026-07-12', '33333333-3333-3333-3333-333333333333', 'good',
    'Funciona bien. Falta un XLR de repuesto.', 'Working fine. Missing a spare XLR.', '33333333-3333-3333-3333-333333333333'),
  ('g2', 'Par de maracas de capacho', 'Pair of capacho maracas', 8500, '2026-05-10', '44444444-4444-4444-4444-444444444444', 'good',
    'Excelente. Sofía las guarda en su estuche.', 'Excellent. Sofía keeps them in her case.', '44444444-4444-4444-4444-444444444444'),
  ('g3', 'Micrófonos Shure SM58 (x2)', 'Shure SM58 microphones (x2)', 19800, '2026-04-12', '11111111-1111-1111-1111-111111111111', 'good',
    'Uno con la rejilla abollada, suena igual.', 'One has a dented grille, sounds fine.', '11111111-1111-1111-1111-111111111111'),
  ('g4', 'Furruco artesanal', 'Handmade furruco', 21000, '2025-11-18', '44444444-4444-4444-4444-444444444444', 'attention',
    'Parche flojo. Cambiar antes de la temporada de gaitas.', 'Loose head. Replace before gaita season.', null),
  ('g5', 'Cuatro de repuesto', 'Backup cuatro', 34000, '2025-10-05', '55555555-5555-5555-5555-555555555555', 'good',
    'Encordado nuevo en julio.', 'Restrung in July.', null),
  ('g6', 'Atriles plegables (4)', 'Folding music stands (4)', 5600, '2026-02-20', '22222222-2222-2222-2222-222222222222', 'attention',
    'Uno con la manivela trabada.', 'One has a jammed crank.', null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Transactions (16)
-- ---------------------------------------------------------------------------
insert into transactions (id, kind, amount_cents, occurred_on, description_es, description_en, proof_url, proof_kind, created_by, event_id, gear_id, category, contributor_id) values
  ('t1', 'in', 45000, '2026-08-16', 'Cachet — Cierre del Festival de Verano', 'Fee — Summer Festival closing set', 'https://drive.google.com/file/d/dtv-zelle-berkeley/view', 'zelle', '33333333-3333-3333-3333-333333333333', 'h1', null, 'fee', null),
  ('t2', 'out', 4730, '2026-08-16', 'Gasolina — van a Berkeley', 'Gas — van to Berkeley', 'https://drive.google.com/file/d/dtv-gas-0816/view', 'receipt', '11111111-1111-1111-1111-111111111111', 'h1', null, null, null),
  ('t3', 'in', 12000, '2026-08-10', 'Donación Zelle — familia Pérez', 'Zelle donation — Pérez family', 'https://drive.google.com/file/d/dtv-donation-perez/view', 'zelle', '33333333-3333-3333-3333-333333333333', null, null, 'donation', null),
  ('t4', 'out', 5000, '2026-07-26', 'Renta de estudio — Sonido Sur', 'Studio rental — Sonido Sur', 'https://drive.google.com/file/d/dtv-studio-0726/view', 'invoice', '33333333-3333-3333-3333-333333333333', 'h3', null, null, null),
  ('t6', 'in', 8600, '2026-07-18', 'Propinas — Ashby Flea Market', 'Tips — Ashby Flea Market', 'https://drive.google.com/file/d/dtv-tips-ashby/view', 'photo', '22222222-2222-2222-2222-222222222222', 'h4', null, 'tip', null),
  ('t5', 'out', 30500, '2026-07-12', 'Mezcladora Behringer Xenyx Q1202USB', 'Behringer Xenyx Q1202USB mixer', 'https://drive.google.com/file/d/dtv-mixer-invoice/view', 'invoice', '33333333-3333-3333-3333-333333333333', null, 'g1', null, null),
  ('t7', 'out', 6800, '2026-06-30', 'Cuerdas de arpa llanera (juego completo)', 'Llanera harp strings (full set)', 'https://drive.google.com/file/d/dtv-strings/view', 'invoice', '11111111-1111-1111-1111-111111111111', null, null, null, null),
  ('t8', 'in', 30000, '2026-06-14', 'Cachet — Quinceañero familia Mendoza', 'Fee — Mendoza quinceañera', 'https://drive.google.com/file/d/dtv-zelle-mendoza/view', 'zelle', '33333333-3333-3333-3333-333333333333', null, null, 'fee', null),
  ('t9', 'out', 14000, '2026-05-28', 'Camisetas del grupo (5 unidades)', 'Band shirts (5 units)', 'https://drive.google.com/file/d/dtv-shirts/view', 'invoice', '55555555-5555-5555-5555-555555555555', null, null, null, null),
  ('t10', 'out', 8500, '2026-05-10', 'Par de maracas de capacho', 'Pair of capacho maracas', 'https://drive.google.com/file/d/dtv-maracas/view', 'invoice', '44444444-4444-4444-4444-444444444444', null, 'g2', null, null),
  ('t11', 'in', 25000, '2026-04-26', 'Cachet — Feria Cultural de Richmond', 'Fee — Richmond Cultural Fair', 'https://drive.google.com/file/d/dtv-zelle-richmond/view', 'zelle', '33333333-3333-3333-3333-333333333333', null, null, 'fee', null),
  ('t12', 'out', 19800, '2026-04-12', 'Micrófonos Shure SM58 (x2)', 'Shure SM58 microphones (x2)', 'https://drive.google.com/file/d/dtv-mics/view', 'invoice', '11111111-1111-1111-1111-111111111111', null, 'g3', null, null),
  ('t0', 'in', 80000, '2026-03-01', 'Saldo inicial — aportes de fundación (5 × $160)', 'Opening balance — founding contributions (5 × $160)', 'https://drive.google.com/file/d/dtv-seed/view', 'zelle', '33333333-3333-3333-3333-333333333333', null, null, 'contribution', null),
  ('t13', 'in', 2000, '2026-08-20', 'Aporte agosto — Rodrigo', 'August contribution — Rodrigo', null, 'zelle', '33333333-3333-3333-3333-333333333333', null, null, 'contribution', '11111111-1111-1111-1111-111111111111'),
  ('t14', 'in', 2000, '2026-08-22', 'Aporte agosto — Caro', 'August contribution — Caro', null, 'zelle', '33333333-3333-3333-3333-333333333333', null, null, 'contribution', '22222222-2222-2222-2222-222222222222'),
  ('t15', 'in', 2000, '2026-08-25', 'Aporte agosto — Sofía', 'August contribution — Sofía', null, 'zelle', '33333333-3333-3333-3333-333333333333', null, null, 'contribution', '44444444-4444-4444-4444-444444444444')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Threads (4) + votes + comments
-- ---------------------------------------------------------------------------
insert into threads (id, author_id, title_es, title_en, body_es, body_en, created_at) values
  ('b1', '22222222-2222-2222-2222-222222222222',
    'Idea: Street Fest de verano en Berkeley', 'Idea: Berkeley summer Street Fest',
    'Postulaciones abren en octubre. Pagan $700 y nos dan puesto de merch. Necesitamos un set de 60 min.',
    'Applications open in October. $700 plus a merch table. We would need a 60-min set.',
    '2026-08-19T00:00:00Z'),
  ('b2', '55555555-5555-5555-5555-555555555555',
    '¿Grabamos un EP de joropo en el garaje?', 'Should we record a joropo EP in the garage?',
    'Cuatro temas, dos fines de semana. Con la mezcladora nueva y los SM58 no gastamos en estudio.',
    'Four tracks, two weekends. With the new mixer and the SM58s we spend nothing on studio time.',
    '2026-08-14T00:00:00Z'),
  ('b3', '11111111-1111-1111-1111-111111111111',
    'Taller de cuatro para niños — Biblioteca de Oakland', 'Cuatro workshop for kids — Oakland Library',
    'La biblioteca ofrece el salón gratis los sábados. No paga, pero nos da visibilidad y lista de correo.',
    'The library offers the room free on Saturdays. No pay, but visibility and a mailing list.',
    '2026-08-05T00:00:00Z'),
  ('b4', '44444444-4444-4444-4444-444444444444',
    'Comprar un micrófono inalámbrico de repuesto', 'Buy a spare wireless microphone',
    'En Berkeley el cable de Caro se enredó dos veces. Un inalámbrico decente cuesta ~$130.',
    'Caro''s cable tangled twice in Berkeley. A decent wireless runs ~$130.',
    '2026-07-30T00:00:00Z')
on conflict (id) do nothing;

insert into thread_votes (thread_id, profile_id) values
  ('b1', '11111111-1111-1111-1111-111111111111'),
  ('b1', '33333333-3333-3333-3333-333333333333'),
  ('b1', '44444444-4444-4444-4444-444444444444'),
  ('b1', '55555555-5555-5555-5555-555555555555'),
  ('b2', '11111111-1111-1111-1111-111111111111'),
  ('b2', '22222222-2222-2222-2222-222222222222'),
  ('b2', '33333333-3333-3333-3333-333333333333'),
  ('b2', '44444444-4444-4444-4444-444444444444'),
  ('b2', '55555555-5555-5555-5555-555555555555'),
  ('b3', '22222222-2222-2222-2222-222222222222'),
  ('b3', '44444444-4444-4444-4444-444444444444'),
  ('b3', '55555555-5555-5555-5555-555555555555'),
  ('b4', '11111111-1111-1111-1111-111111111111'),
  ('b4', '33333333-3333-3333-3333-333333333333')
on conflict do nothing;

insert into thread_comments (id, thread_id, author_id, body_es, body_en) values
  (1, 'b1', '11111111-1111-1111-1111-111111111111', 'Me anoto. Con el set del Festival Latino más tres gaitas llegamos a 60 min.', 'I am in. The Festival Latino set plus three gaitas gets us to 60 min.'),
  (2, 'b1', '33333333-3333-3333-3333-333333333333', '$700 cubre el estudio de todo el trimestre. Vale la pena.', '$700 covers a full quarter of studio time. Worth it.'),
  (3, 'b1', '44444444-4444-4444-4444-444444444444', '¿Hay tarima o tocamos en el piso? Cambia el armado de tambores.', 'Is there a stage or are we on the ground? Changes the drum setup.'),
  (4, 'b2', '22222222-2222-2222-2222-222222222222', 'Propongo Pajarillo, Quirpa, Seis por Derecho y Alma Llanera.', 'I propose Pajarillo, Quirpa, Seis por Derecho and Alma Llanera.'),
  (5, 'b2', '11111111-1111-1111-1111-111111111111', 'El garaje tiene eco. Habría que colgar cobijas.', 'The garage has a slap echo. We would need blankets on the walls.'),
  (6, 'b2', '33333333-3333-3333-3333-333333333333', 'Mezcla y master por fuera: ~$120 por tema. Hay que presupuestarlo.', 'Outside mix and master: ~$120 per track. We need to budget it.'),
  (7, 'b2', '44444444-4444-4444-4444-444444444444', 'Los tambores los grabo en el patio, suenan mejor abiertos.', 'I would track the drums in the yard, they breathe better outside.'),
  (8, 'b3', '55555555-5555-5555-5555-555555555555', 'Yo puedo dar la parte de acordes básicos.', 'I can teach the basic chords section.'),
  (9, 'b3', '22222222-2222-2222-2222-222222222222', 'Necesitamos cuatros prestados para los niños.', 'We would need loaner cuatros for the kids.'),
  (10, 'b4', '33333333-3333-3333-3333-333333333333', 'Después del Festival Latino el fondo lo aguanta.', 'After Festival Latino the pool can absorb it.')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Advance serial sequences past the explicit ids
-- ---------------------------------------------------------------------------
select setval('polls_id_seq', (select coalesce(max(id), 1) from polls));
select setval('poll_options_id_seq', (select coalesce(max(id), 1) from poll_options));
select setval('event_media_id_seq', (select coalesce(max(id), 1) from event_media));
select setval('thread_comments_id_seq', (select coalesce(max(id), 1) from thread_comments));
select setval('song_links_id_seq', (select coalesce(max(id), 1) from song_links));
