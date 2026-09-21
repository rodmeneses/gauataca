-- GUATACA — V9: forum polls.
--
-- Adds a poll to a forum idea (one poll per idea, created with the idea):
--   * `thread_polls`         — the question, tied to a thread.
--   * `thread_poll_options`  — the choices.
--   * `thread_poll_votes`    — one row per member per option.
--
-- Mirrors the event polls (`polls` / `poll_options` / `poll_votes`): the poll and
-- its options are admin-created; each member writes their own vote. Deleting a
-- thread cascades through poll → options → votes.

create table thread_polls (
  id serial primary key,
  thread_id text not null unique references threads(id) on delete cascade,
  question_es text not null,
  question_en text not null
);

create table thread_poll_options (
  id serial primary key,
  poll_id int not null references thread_polls(id) on delete cascade,
  label_es text not null,
  label_en text not null
);

create table thread_poll_votes (
  option_id int not null references thread_poll_options(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  primary key (option_id, profile_id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table thread_polls         enable row level security;
alter table thread_poll_options  enable row level security;
alter table thread_poll_votes    enable row level security;

-- Everyone reads everything.
create policy "thread_polls_select" on thread_polls for select using (true);
create policy "thread_poll_options_select" on thread_poll_options for select using (true);
create policy "thread_poll_votes_select" on thread_poll_votes for select using (true);

-- Poll + options: admin-only (mirrors event `polls_write` / `poll_options_write`).
create policy "thread_polls_write" on thread_polls for all using (is_admin()) with check (is_admin());
create policy "thread_poll_options_write" on thread_poll_options for all using (is_admin()) with check (is_admin());

-- Votes: each member writes their own row (mirrors `poll_votes_write`).
create policy "thread_poll_votes_write" on thread_poll_votes for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
