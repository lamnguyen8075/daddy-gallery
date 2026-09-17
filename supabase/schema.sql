-- Paste this in Supabase → SQL → New query → Run.
-- Public on the bucket is not enough; this lets the website list the files.

insert into storage.buckets (id, name, public)
values ('handmade', 'handmade', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view handmade images" on storage.objects;
create policy "Public can view handmade images"
  on storage.objects
  for select
  to public
  using (bucket_id = 'handmade');

drop policy if exists "Public can write handmade captions" on storage.objects;
create policy "Public can write handmade captions"
  on storage.objects
  for insert
  to public
  with check (
    bucket_id = 'handmade'
    and name like 'captions/%'
  );

drop policy if exists "Public can update handmade captions" on storage.objects;
create policy "Public can update handmade captions"
  on storage.objects
  for update
  to public
  using (
    bucket_id = 'handmade'
    and name like 'captions/%'
  )
  with check (
    bucket_id = 'handmade'
    and name like 'captions/%'
  );
