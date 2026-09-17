-- Paste this in Supabase → SQL → New query → Run.
-- New log table. The old name "clicks" is often blocked by ad blockers.

create table if not exists public.nhatky (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  target text,
  created_at timestamptz not null default now()
);

alter table public.nhatky enable row level security;

drop policy if exists "Public can insert nhatky" on public.nhatky;
create policy "Public can insert nhatky"
  on public.nhatky
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public can read nhatky" on public.nhatky;
create policy "Public can read nhatky"
  on public.nhatky
  for select
  to anon, authenticated
  using (true);

grant insert, select on public.nhatky to anon, authenticated;

-- Keep any rows already stored in clicks.
insert into public.nhatky (kind, target, created_at)
select kind, target, created_at
from public.clicks
where kind is not null
  and kind <> 'probe'
  and not exists (select 1 from public.nhatky);
