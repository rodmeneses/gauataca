-- BandSync — receipt / invoice image storage (Supabase Storage).
-- A public `receipts` bucket: everyone reads (ledger transparency is
-- intentional), admins write. `proof_url` on transactions points at these
-- public URLs.

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

create policy "receipts_read" on storage.objects
  for select using (bucket_id = 'receipts');

create policy "receipts_insert" on storage.objects
  for insert with check (bucket_id = 'receipts' and public.is_admin());

create policy "receipts_update" on storage.objects
  for update using (bucket_id = 'receipts' and public.is_admin());

create policy "receipts_delete" on storage.objects
  for delete using (bucket_id = 'receipts' and public.is_admin());
