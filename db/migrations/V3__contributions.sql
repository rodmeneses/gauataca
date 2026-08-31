-- BandSync — V3: income categories + per-member contribution tracking.
-- Adds a nullable `category` to income movements (fee/tip/donation/contribution),
-- a `contributor_id` for attributing a contribution to a member, and a small
-- key/value `settings` table holding the monthly cuota.

-- 1. Income category (null for expenses — they already link to event/gear).
alter table transactions add column category text;
alter table transactions add constraint transactions_category_check
  check (category is null or category in ('fee', 'tip', 'donation', 'contribution'));

-- 2. Who a contribution belongs to (null for non-contribution movements).
alter table transactions add column contributor_id uuid references profiles(id);

-- 3. Band settings (single-row key/value) — the monthly cuota lives here.
create table settings (
  key text primary key,
  value text not null
);

alter table settings enable row level security;
create policy "settings_select" on settings for select using (true);
create policy "settings_write" on settings for all using (is_admin()) with check (is_admin());

insert into settings (key, value) values ('monthly_cuota_cents', '2000')
  on conflict (key) do nothing;
