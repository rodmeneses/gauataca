-- BandSync — song recordings ("takes") on practice events.
-- A take is a recording of one song made during a practice (studio/garage).
-- `n` is the take number for that song (1-based, global across all practices),
-- so "Take 1 / Take 2 / Take 3" doubles as a measure of how much a song has
-- been practiced.

create table takes (
  id text primary key,
  event_id text not null references events(id) on delete cascade,
  song_id text not null references songs(id) on delete cascade,
  url text not null,
  n int not null,
  created_at timestamptz not null default now()
);

alter table takes enable row level security;
create policy "takes_select" on takes for select using (true);
create policy "takes_write" on takes for all using (is_admin()) with check (is_admin());
