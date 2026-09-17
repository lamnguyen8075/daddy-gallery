-- Paste this in Supabase → SQL → New query → Run.
-- Stores a row for each tap: what was clicked, and when.

create table if not exists public.clicks (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  target text,
  created_at timestamptz not null default now()
);

alter table public.clicks enable row level security;

drop policy if exists "Public can insert clicks" on public.clicks;
create policy "Public can insert clicks"
  on public.clicks
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public can read clicks" on public.clicks;
create policy "Public can read clicks"
  on public.clicks
  for select
  to anon, authenticated
  using (true);

grant insert, select on public.clicks to anon, authenticated;
