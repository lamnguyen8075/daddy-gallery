-- Paste this in Supabase → SQL → New query → Run.
-- New log table. The old name "clicks" is often blocked by ad blockers.

create table if not exists public.nhatky (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  target text,
  ip text,
  location text,
  created_at timestamptz not null default now()
);

alter table public.nhatky add column if not exists ip text;
alter table public.nhatky add column if not exists location text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'nhatky'
      and column_name = 'province'
  ) then
    update public.nhatky
    set location = province
    where location is null
      and province is not null;
  end if;
end $$;

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
