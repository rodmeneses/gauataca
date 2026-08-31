-- BandSync — Phase 2 schema (Supabase / Postgres)
-- Paste this whole file into the Supabase SQL editor, then run supabase/seed.sql.
-- Recreates the tables with bilingual (_es/_en) columns and RLS. Idempotent.

-- ---------------------------------------------------------------------------
-- Drop existing tables (reverse dependency order)
-- ---------------------------------------------------------------------------
drop table if exists thread_comments cascade;
drop table if exists thread_votes cascade;
drop table if exists threads cascade;
drop table if exists gear_custody_log cascade;
drop table if exists transactions cascade;
drop table if exists gear cascade;
drop table if exists poll_votes cascade;
drop table if exists poll_options cascade;
drop table if exists polls cascade;
drop table if exists feedback cascade;
drop table if exists event_attendance cascade;
drop table if exists event_media cascade;
drop table if exists event_songs cascade;
drop table if exists events cascade;
drop table if exists songs cascade;
drop table if exists profile_vocals cascade;
drop table if exists profile_instruments cascade;
drop table if exists profiles cascade;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- profiles.id is uuid but NOT a foreign key to auth.users, so demo members can
-- be seeded with fixed UUIDs; real users still use their auth.uid().
create table profiles (
  id uuid primary key,
  name text not null,
  email text,
  role text not null default 'member' check (role in ('admin', 'member')),
  title_es text,
  title_en text,
  joined_at timestamptz not null default now()
);

create table profile_instruments (
  profile_id uuid references profiles(id) on delete cascade,
  instrument_es text not null,
  instrument_en text not null,
  proficiency text not null check (proficiency in ('expert', 'inter', 'beg')),
  primary key (profile_id, instrument_es)
);

create table profile_vocals (
  profile_id uuid references profiles(id) on delete cascade,
  flag text not null check (flag in ('lead', 'chorus', 'none')),
  primary key (profile_id, flag)
);

create table songs (
  id text primary key,
  title_es text not null,
  title_en text not null,
  genre text not null,
  key text not null,
  bpm int not null,
  duration text not null,
  chart_url text,
  youtube_url text,
  spotify_url text,
  recording_url text,
  last_rehearsed_at date
);

create table events (
  id text primary key,
  type text not null check (type in ('gig', 'studio', 'garage')),
  state text not null default 'active' check (state in ('active', 'cancelled', 'rescheduled')),
  starts_at timestamptz not null,
  venue text not null,
  fee_cents int not null default 0,
  attend int not null default 0,
  flyer_url text,
  title_es text not null,
  title_en text not null,
  note_es text,
  note_en text,
  previous_starts_at timestamptz
);

create table event_songs (
  event_id text references events(id) on delete cascade,
  song_id text references songs(id) on delete cascade,
  position int not null,
  primary key (event_id, song_id)
);

create table event_media (
  id serial primary key,
  event_id text references events(id) on delete cascade,
  label_es text not null,
  label_en text not null,
  url text not null,
  submitted_by uuid references profiles(id)
);

create table event_attendance (
  event_id text references events(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  status text not null check (status in ('going', 'maybe', 'no')),
  updated_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

create table feedback (
  event_id text references events(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  anonymous boolean not null default false,
  sound numeric,
  performance numeric,
  logistics numeric,
  energy numeric,
  went_well_es text,
  went_well_en text,
  improve_es text,
  improve_en text,
  primary key (event_id, profile_id)
);

create table polls (
  id serial primary key,
  event_id text references events(id) on delete cascade,
  question_es text not null,
  question_en text not null
);

create table poll_options (
  id serial primary key,
  poll_id int references polls(id) on delete cascade,
  label_es text not null,
  label_en text not null
);

create table poll_votes (
  option_id int references poll_options(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (option_id, profile_id)
);

create table gear (
  id text primary key,
  name_es text not null,
  name_en text not null,
  cost_cents int not null,
  purchased_on date not null,
  custodian_id uuid references profiles(id),
  condition text not null default 'good' check (condition in ('good', 'attention')),
  note_es text,
  note_en text
);

create table gear_custody_log (
  id serial primary key,
  gear_id text references gear(id) on delete cascade,
  from_id uuid references profiles(id),
  to_id uuid references profiles(id),
  at timestamptz not null default now()
);

create table transactions (
  id text primary key,
  kind text not null check (kind in ('in', 'out')),
  amount_cents int not null,
  occurred_on date not null,
  description_es text not null,
  description_en text not null,
  proof_url text,
  proof_kind text not null default 'receipt' check (proof_kind in ('zelle', 'invoice', 'photo', 'receipt')),
  created_by uuid references profiles(id),
  event_id text references events(id),
  gear_id text references gear(id)
);

create table threads (
  id text primary key,
  author_id uuid references profiles(id),
  title_es text not null,
  title_en text not null,
  body_es text not null,
  body_en text not null,
  created_at timestamptz not null default now()
);

create table thread_votes (
  thread_id text references threads(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  primary key (thread_id, profile_id)
);

create table thread_comments (
  id serial primary key,
  thread_id text references threads(id) on delete cascade,
  author_id uuid references profiles(id),
  body_es text not null,
  body_en text not null
);

-- ---------------------------------------------------------------------------
-- Helper: is the current auth user an admin?
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table profiles            enable row level security;
alter table profile_instruments  enable row level security;
alter table profile_vocals       enable row level security;
alter table songs                enable row level security;
alter table events               enable row level security;
alter table event_songs          enable row level security;
alter table event_media          enable row level security;
alter table event_attendance     enable row level security;
alter table feedback             enable row level security;
alter table polls                enable row level security;
alter table poll_options         enable row level security;
alter table poll_votes           enable row level security;
alter table gear                 enable row level security;
alter table gear_custody_log     enable row level security;
alter table transactions         enable row level security;
alter table threads              enable row level security;
alter table thread_votes         enable row level security;
alter table thread_comments      enable row level security;

-- Everyone reads everything (ledger transparency is intentional).
create policy "profiles_select" on profiles for select using (true);
create policy "profile_instruments_select" on profile_instruments for select using (true);
create policy "profile_vocals_select" on profile_vocals for select using (true);
create policy "songs_select" on songs for select using (true);
create policy "events_select" on events for select using (true);
create policy "event_songs_select" on event_songs for select using (true);
create policy "event_media_select" on event_media for select using (true);
create policy "event_attendance_select" on event_attendance for select using (true);
create policy "feedback_select" on feedback for select using (true);
create policy "polls_select" on polls for select using (true);
create policy "poll_options_select" on poll_options for select using (true);
create policy "poll_votes_select" on poll_votes for select using (true);
create policy "gear_select" on gear for select using (true);
create policy "gear_custody_log_select" on gear_custody_log for select using (true);
create policy "transactions_select" on transactions for select using (true);
create policy "threads_select" on threads for select using (true);
create policy "thread_votes_select" on thread_votes for select using (true);
create policy "thread_comments_select" on thread_comments for select using (true);

-- Profiles: users manage their own row; admins manage any.
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on profiles for update using (auth.uid() = id or is_admin());
create policy "profiles_delete" on profiles for delete using (is_admin());

-- Profile instruments / vocals: own rows (or admin).
create policy "profile_instruments_write" on profile_instruments for all using (auth.uid() = profile_id or is_admin()) with check (auth.uid() = profile_id or is_admin());
create policy "profile_vocals_write" on profile_vocals for all using (auth.uid() = profile_id or is_admin()) with check (auth.uid() = profile_id or is_admin());

-- Admin-only writes.
create policy "songs_write" on songs for all using (is_admin()) with check (is_admin());
create policy "events_write" on events for all using (is_admin()) with check (is_admin());
create policy "event_songs_write" on event_songs for all using (is_admin()) with check (is_admin());
create policy "event_media_write" on event_media for all using (is_admin()) with check (is_admin());
create policy "transactions_write" on transactions for all using (is_admin()) with check (is_admin());
create policy "gear_write" on gear for all using (is_admin()) with check (is_admin());
create policy "gear_custody_log_write" on gear_custody_log for all using (is_admin()) with check (is_admin());
create policy "polls_write" on polls for all using (is_admin()) with check (is_admin());
create policy "poll_options_write" on poll_options for all using (is_admin()) with check (is_admin());

-- Attendance: each member writes their own row.
create policy "event_attendance_write" on event_attendance for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Feedback: each member writes their own row.
create policy "feedback_write" on feedback for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Poll votes: each member writes their own vote.
create policy "poll_votes_write" on poll_votes for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Threads: members create; author (or admin) edits/deletes.
create policy "threads_insert" on threads for insert with check (auth.uid() = author_id);
create policy "threads_update" on threads for update using (auth.uid() = author_id or is_admin());
create policy "threads_delete" on threads for delete using (auth.uid() = author_id or is_admin());

-- Thread votes: each member writes their own vote.
create policy "thread_votes_write" on thread_votes for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

-- Thread comments: members create; author (or admin) edits/deletes.
create policy "thread_comments_insert" on thread_comments for insert with check (auth.uid() = author_id);
create policy "thread_comments_update" on thread_comments for update using (auth.uid() = author_id or is_admin());
create policy "thread_comments_delete" on thread_comments for delete using (auth.uid() = author_id or is_admin());
