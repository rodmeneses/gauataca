-- BandSync — instrument catalog, member/song instruments, onboarding.
-- Replaces the free-form profile_instruments (instrument_es/en) with a shared
-- `instruments` catalog referenced by id, so songs can declare which
-- instruments they require. Also adds an `onboarded` flag so new sign-ups can
-- be asked for their instruments before entering the app.

-- ---------------------------------------------------------------------------
-- 1. Instrument catalog
-- ---------------------------------------------------------------------------
create table instruments (
  id text primary key,
  name_es text not null,
  name_en text not null,
  is_basic boolean not null default false
);

alter table instruments enable row level security;
create policy "instruments_select" on instruments for select using (true);
create policy "instruments_write" on instruments for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- 2. Seed the five basic instruments
-- ---------------------------------------------------------------------------
insert into instruments (id, name_es, name_en, is_basic) values
  ('cuatro', 'Cuatro', 'Cuatro', true),
  ('guitarra', 'Guitarra', 'Guitar', true),
  ('bajo', 'Bajo', 'Bass', true),
  ('piano', 'Piano', 'Piano', true),
  ('percusion', 'Percusión', 'Percussion', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Promote existing profile_instruments names into the catalog (custom).
--    Known seed names get stable ids; anything else gets a deterministic id.
-- ---------------------------------------------------------------------------
insert into instruments (id, name_es, name_en, is_basic)
select
  case
    when s.instrument_es = 'Arpa llanera' then 'arpa'
    when s.instrument_es = 'Voz principal' then 'voz'
    when s.instrument_es = 'Tambores culo''e puya' then 'tambores'
    when s.instrument_es = 'Furruco' then 'furruco'
    else 'i_' || md5(s.instrument_es)
  end,
  s.instrument_es, s.instrument_en, false
from (select distinct instrument_es, instrument_en from profile_instruments) s
where not exists (select 1 from instruments i where i.name_es = s.instrument_es)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Rebuild profile_instruments to reference the catalog by id
-- ---------------------------------------------------------------------------
create table profile_instruments_new (
  profile_id uuid references profiles(id) on delete cascade,
  instrument_id text references instruments(id) on delete cascade,
  proficiency text not null check (proficiency in ('expert', 'inter', 'beg')),
  primary key (profile_id, instrument_id)
);

insert into profile_instruments_new (profile_id, instrument_id, proficiency)
select pi.profile_id, i.id, pi.proficiency
from profile_instruments pi
join instruments i on i.name_es = pi.instrument_es;

drop table profile_instruments;
alter table profile_instruments_new rename to profile_instruments;

alter table profile_instruments enable row level security;
create policy "profile_instruments_select" on profile_instruments for select using (true);
create policy "profile_instruments_write" on profile_instruments for all using (auth.uid() = profile_id or is_admin()) with check (auth.uid() = profile_id or is_admin());

-- ---------------------------------------------------------------------------
-- 5. Song → required instruments
-- ---------------------------------------------------------------------------
create table song_instruments (
  song_id text references songs(id) on delete cascade,
  instrument_id text references instruments(id) on delete cascade,
  primary key (song_id, instrument_id)
);

alter table song_instruments enable row level security;
create policy "song_instruments_select" on song_instruments for select using (true);
create policy "song_instruments_write" on song_instruments for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------------
-- 6. Onboarding flag (new sign-ups start false; existing profiles are done)
-- ---------------------------------------------------------------------------
alter table profiles add column onboarded boolean not null default false;
update profiles set onboarded = true;

-- ---------------------------------------------------------------------------
-- 7. Let admins insert roster profiles (members added without a login)
-- ---------------------------------------------------------------------------
drop policy "profiles_insert" on profiles;
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id or is_admin());
