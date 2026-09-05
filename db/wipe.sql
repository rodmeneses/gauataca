-- BandSync — wipe the database for a fresh start (manual, NOT a Flyway migration)
-- Run this in the Supabase SQL editor (or psql) BEFORE `flyway migrate` to drop
-- every BandSync table, the Flyway history, the receipts storage policies and
-- the auto-profile trigger. After this the schema is empty, so `flyway migrate`
-- applies V1 from scratch.

-- Storage policies (drop them so V1 can recreate them). The `receipts` bucket
-- itself is left in place: Supabase blocks direct deletes from storage tables,
-- and V1's `on conflict (id) do nothing` reuses the existing bucket. To also
-- clear the stored receipt files, delete the bucket in the dashboard
-- (Storage → receipts → Delete bucket).
drop policy if exists "receipts_read" on storage.objects;
drop policy if exists "receipts_insert" on storage.objects;
drop policy if exists "receipts_update" on storage.objects;
drop policy if exists "receipts_delete" on storage.objects;

-- Auto-profile trigger + function.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Flyway history.
drop table if exists flyway_schema_history cascade;

-- BandSync tables (children first).
drop table if exists takes cascade;
drop table if exists song_links cascade;
drop table if exists song_instruments cascade;
drop table if exists instruments cascade;
drop table if exists thread_comments cascade;
drop table if exists thread_votes cascade;
drop table if exists threads cascade;
drop table if exists transactions cascade;
drop table if exists gear_custody_log cascade;
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

-- Legacy table from the pre-consolidation schema (cuota settings — removed).
drop table if exists settings cascade;

-- Helper function.
drop function if exists public.is_admin();
