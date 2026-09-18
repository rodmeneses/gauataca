-- ---------------------------------------------------------------------------
-- Web Push notifications.
--
-- Two additions:
--   1. Per-member category preferences on `profiles` (which kinds of
--      notifications a member wants). Default `true` — the real opt-in gate is
--      granting browser permission and creating a `push_subscriptions` row;
--      the toggles let a member turn a category off (or back on) afterwards.
--   2. `push_subscriptions` — one row per signed-up device, storing the Web
--      Push subscription (endpoint + P-256 auth keys) the service worker
--      creates when the member enables notifications.
--
-- The notification fan-out itself runs server-side in a Vercel function
-- (`api/notify.ts`), which reads these tables with the service-role key, so RLS
-- here only constrains the client: each member manages their own subscriptions.
-- ---------------------------------------------------------------------------

alter table profiles
  add column if not exists notify_events boolean not null default true,
  add column if not exists notify_forum  boolean not null default true;

create table if not exists push_subscriptions (
  id         bigint generated always as identity primary key,
  profile_id uuid   not null references profiles(id) on delete cascade,
  endpoint   text   not null unique,
  p256dh     text   not null,
  auth       text   not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_profile_idx
  on push_subscriptions (profile_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table push_subscriptions enable row level security;

-- Each member reads, inserts and deletes their own devices' subscriptions.
create policy "push_subscriptions_select" on push_subscriptions
  for select using (auth.uid() = profile_id);

create policy "push_subscriptions_insert" on push_subscriptions
  for insert with check (auth.uid() = profile_id);

create policy "push_subscriptions_delete" on push_subscriptions
  for delete using (auth.uid() = profile_id);
