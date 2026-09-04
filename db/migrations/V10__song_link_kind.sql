-- BandSync — song link kind (option 2: one links list, tagged by kind)
-- Flyway V10. Additive only. Adds a `kind` discriminator to `song_links` so a
-- song can carry any number of YouTube / Apple Music / Spotify / chart links in
-- one table. The legacy single-column streaming URLs on `songs` are left in
-- place (unused) per the additive-only policy.

alter table song_links add column kind text not null default 'chart'
  check (kind in ('youtube', 'apple', 'spotify', 'chart'));
