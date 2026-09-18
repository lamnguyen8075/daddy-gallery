-- Paste this in Supabase → SQL → New query → Run.
-- Lets the public site add photos into handmade/uploads/
-- and lets admin delete photos from the site.

-- Default bucket cap is 2MB. Phone photos are often 2.5–6MB; the site allows 8MB.
update storage.buckets
set file_size_limit = 8388608
where id = 'handmade';

drop policy if exists "Public can upload handmade photos" on storage.objects;
create policy "Public can upload handmade photos"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'handmade'
    and name like 'uploads/%'
    and name not like 'uploads/captions/%'
  );

drop policy if exists "Public can delete handmade photos" on storage.objects;
create policy "Public can delete handmade photos"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'handmade');
