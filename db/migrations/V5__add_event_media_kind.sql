-- Distinguish event photos (uploaded to Storage) from videos (Google Drive links).
alter table event_media add column kind text not null default 'video'
  check (kind in ('photo', 'video'));

-- ---------------------------------------------------------------------------
-- Event photo storage (Supabase Storage). Public read, admin-gated writes —
-- mirrors the `receipts` bucket.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', true)
on conflict (id) do nothing;

create policy "event_photos_read" on storage.objects
  for select using (bucket_id = 'event-photos');

create policy "event_photos_insert" on storage.objects
  for insert with check (bucket_id = 'event-photos' and public.is_admin());

create policy "event_photos_update" on storage.objects
  for update using (bucket_id = 'event-photos' and public.is_admin());

create policy "event_photos_delete" on storage.objects
  for delete using (bucket_id = 'event-photos' and public.is_admin());
