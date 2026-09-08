-- GUATACA — V6: allow 'metronome' song links.
--
-- Songs can now carry a link to a metronome web page (tempo practice tool)
-- alongside YouTube / Apple Music / Spotify / chart links. Extend the
-- song_links.kind check constraint (frontend type + link editor updated in the
-- same change).

alter table song_links drop constraint if exists song_links_kind_check;
alter table song_links add constraint song_links_kind_check
  check (kind in ('youtube', 'apple', 'spotify', 'metronome', 'chart'));
