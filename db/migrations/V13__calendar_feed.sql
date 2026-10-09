-- ---------------------------------------------------------------------------
-- Subscribable calendar feed.
--
-- Each member gets one secret token. The Vercel function `api/calendar.ts`
-- serves every event as an iCalendar feed at /api/calendar?token=<token>, so a
-- member can subscribe from Apple/Google/Outlook Calendar and stay in sync.
-- The function resolves the token with the service-role key; the client only
-- ever reads/creates its own row, so tokens are never visible to other members.
-- ---------------------------------------------------------------------------
create table if not exists calendar_tokens (
  profile_id uuid primary key references profiles(id) on delete cascade,
  token      uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table calendar_tokens enable row level security;

create policy "calendar_tokens_select" on calendar_tokens
  for select using (auth.uid() = profile_id);

create policy "calendar_tokens_insert" on calendar_tokens
  for insert with check (auth.uid() = profile_id);

-- Rotating = delete + re-create, which invalidates the old URL.
create policy "calendar_tokens_delete" on calendar_tokens
  for delete using (auth.uid() = profile_id);
