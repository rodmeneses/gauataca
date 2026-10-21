-- GUATACA — V15: availability polls.
--
-- Before a gig is on the calendar, an admin proposes a few candidate dates and each
-- member marks which ones they can make:
--   * `availability_polls`   — the question (title), open/closed, who created it.
--   * `availability_dates`   — the candidate dates of a poll.
--   * `availability_votes`   — one row per member per date: 'yes' | 'maybe' | 'no'.
--                              No row = hasn't answered yet.
--
-- Everyone reads; polls and dates are admin-managed; each member writes their own votes.
-- Deleting a poll cascades to its dates and votes.

create table availability_polls (
  id serial primary key,
  title text not null,
  closed boolean not null default false,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table availability_dates (
  poll_id int not null references availability_polls(id) on delete cascade,
  date date not null,
  primary key (poll_id, date)
);

create table availability_votes (
  poll_id int not null,
  date date not null,
  profile_id uuid not null references profiles(id) on delete cascade,
  answer text not null check (answer in ('yes', 'maybe', 'no')),
  primary key (poll_id, date, profile_id),
  foreign key (poll_id, date) references availability_dates(poll_id, date) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table availability_polls enable row level security;
alter table availability_dates enable row level security;
alter table availability_votes enable row level security;

create policy "availability_polls_select" on availability_polls for select using (true);
create policy "availability_dates_select" on availability_dates for select using (true);
create policy "availability_votes_select" on availability_votes for select using (true);

create policy "availability_polls_write" on availability_polls for all using (is_admin()) with check (is_admin());
create policy "availability_dates_write" on availability_dates for all using (is_admin()) with check (is_admin());

-- Votes: each member writes their own row, and only while the poll is open.
create policy "availability_votes_write" on availability_votes for all
  using (auth.uid() = profile_id)
  with check (
    auth.uid() = profile_id
    and exists (select 1 from availability_polls p where p.id = poll_id and not p.closed)
  );
