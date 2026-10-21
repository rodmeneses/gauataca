-- GUATACA — V14: event links.
--
-- Any number of labelled links per event (setlist doc, venue page, Drive folder, …),
-- mirroring song_links. Everyone reads; admins write (same as events).

create table event_links (
  id serial primary key,
  event_id text not null references events(id) on delete cascade,
  label text not null,
  url text not null,
  position int not null default 0
);

alter table event_links enable row level security;

create policy "event_links_select" on event_links for select using (true);
create policy "event_links_write" on event_links for all using (is_admin()) with check (is_admin());
