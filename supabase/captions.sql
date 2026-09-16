-- Paste this in Supabase → SQL → New query → Run.
-- MiniMax writes title + description once; the website only fetches after that.

create table if not exists public.photo_captions (
  id text primary key,
  title text not null,
  description text not null,
  image text,
  prompt_version int not null default 1,
  created_at timestamptz not null default now()
);

alter table public.photo_captions add column if not exists prompt_version int not null default 1;

alter table public.photo_captions enable row level security;

drop policy if exists "Public can read photo captions" on public.photo_captions;
create policy "Public can read photo captions"
  on public.photo_captions
  for select
  to public
  using (true);

drop policy if exists "Public can insert photo captions" on public.photo_captions;
create policy "Public can insert photo captions"
  on public.photo_captions
  for insert
  to public
  with check (true);

drop policy if exists "Public can update photo captions" on public.photo_captions;
create policy "Public can update photo captions"
  on public.photo_captions
  for update
  to public
  using (true)
  with check (true);

grant select, insert, update on public.photo_captions to anon, authenticated;
