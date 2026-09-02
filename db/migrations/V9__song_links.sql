-- BandSync — song links (real-version streaming links + multiple chart/tab links)
-- Flyway V9. Additive only. Adds the Apple Music column to `songs` and a new
-- `song_links` table so a song can carry several tabs/sheet-music links.

alter table songs add column apple_music_url text;

create table song_links (
  id serial primary key,
  song_id text references songs(id) on delete cascade,
  label_es text not null,
  label_en text not null,
  url text not null,
  position int not null default 0
);

alter table song_links enable row level security;
create policy "song_links_select" on song_links for select using (true);
create policy "song_links_write" on song_links for all using (is_admin()) with check (is_admin());
