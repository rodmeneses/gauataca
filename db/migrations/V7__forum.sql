-- GUATACA — V7: forum (ideas board) upgrade.
--
-- Turns the brainstorm tab into a real forum:
--   * Comments gain replies (one level, enforced in the UI) and timestamps.
--   * Up/down votes on threads (`thread_votes`) are replaced by like/dislike on
--     threads AND comments (`thread_reactions` / `thread_comment_reactions`).
--   * Threads and comments can carry photos (`thread_media`) and references to
--     songs/events (`thread_refs`, polymorphic `ref_id` — no FK by design).
--
-- Replies are modeled with a composite self-FK on `thread_comments(id, thread_id)`
-- so a reply's `thread_id` must match its parent's and deleting a parent cascades
-- its replies. "One level" is an app rule (the UI only offers Reply on top-level
-- comments), not a DB constraint.

-- ---------------------------------------------------------------------------
-- thread_comments: replies + timestamps
-- ---------------------------------------------------------------------------
alter table thread_comments add column parent_id int;
alter table thread_comments add column created_at timestamptz not null default now();

-- Enables a composite FK from (parent_id, thread_id) → (id, thread_id).
alter table thread_comments add constraint thread_comments_id_thread_id_key unique (id, thread_id);

alter table thread_comments add constraint thread_comments_parent_fk
  foreign key (parent_id, thread_id) references thread_comments (id, thread_id) on delete cascade;

-- ---------------------------------------------------------------------------
-- Reactions (like / dislike) on threads and comments
-- ---------------------------------------------------------------------------
create table thread_reactions (
  thread_id text not null references threads(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('like', 'dislike')),
  primary key (thread_id, profile_id)
);

create table thread_comment_reactions (
  comment_id int not null references thread_comments(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('like', 'dislike')),
  primary key (comment_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- Media (photos) on threads and comments
-- ---------------------------------------------------------------------------
create table thread_media (
  id serial primary key,
  thread_id text not null references threads(id) on delete cascade,
  comment_id int,
  url text not null,
  author_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  foreign key (comment_id, thread_id) references thread_comments (id, thread_id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- References to songs / events, on threads and comments
-- ---------------------------------------------------------------------------
create table thread_refs (
  id serial primary key,
  thread_id text not null references threads(id) on delete cascade,
  comment_id int,
  ref_kind text not null check (ref_kind in ('song', 'event')),
  ref_id text not null,
  author_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  foreign key (comment_id, thread_id) references thread_comments (id, thread_id) on delete cascade
);

-- Old one-flavour vote table goes away (no inbound FKs; its policies drop with it).
drop table if exists thread_votes;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table thread_reactions         enable row level security;
alter table thread_comment_reactions enable row level security;
alter table thread_media             enable row level security;
alter table thread_refs              enable row level security;

-- Everyone reads everything (ledger transparency is intentional).
create policy "thread_reactions_select" on thread_reactions for select using (true);
create policy "thread_comment_reactions_select" on thread_comment_reactions for select using (true);
create policy "thread_media_select" on thread_media for select using (true);
create policy "thread_refs_select" on thread_refs for select using (true);

-- Reactions: each member writes their own row (mirrors poll_votes).
create policy "thread_reactions_write" on thread_reactions for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "thread_comment_reactions_write" on thread_comment_reactions for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Media / refs: author edits/deletes; admins manage any (mirrors thread_comments).
create policy "thread_media_write" on thread_media for all using (auth.uid() = author_id or is_admin()) with check (auth.uid() = author_id or is_admin());
create policy "thread_refs_write" on thread_refs for all using (auth.uid() = author_id or is_admin()) with check (auth.uid() = author_id or is_admin());

-- ---------------------------------------------------------------------------
-- Forum photo storage (Supabase Storage).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('forum-photos', 'forum-photos', true)
on conflict (id) do nothing;

create policy "forum_photos_read" on storage.objects
  for select using (bucket_id = 'forum-photos');

create policy "forum_photos_insert" on storage.objects
  for insert with check (bucket_id = 'forum-photos' and auth.role() = 'authenticated');

create policy "forum_photos_delete" on storage.objects
  for delete using (bucket_id = 'forum-photos' and (owner = auth.uid() or public.is_admin()));
