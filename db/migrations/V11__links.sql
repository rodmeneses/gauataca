-- GUATACA — V11: general links.
--
-- A shared board of band links (Drive folders, playlists, group chats, …).
-- Everyone reads; any signed-in member adds; the author or an admin deletes.

create table links (
  id serial primary key,
  title text not null,
  url text not null,
  category text not null default 'other' check (category in ('docs', 'music', 'social', 'logistics', 'other')),
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table links enable row level security;

create policy "links_select" on links for select using (true);
create policy "links_insert" on links for insert with check (auth.uid() = created_by);
create policy "links_delete" on links for delete using (auth.uid() = created_by or is_admin());
