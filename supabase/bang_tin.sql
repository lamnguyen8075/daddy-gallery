-- Paste this in Supabase → SQL → New query → Run.
-- One row per heart, with created_at so the bell can order it.
-- Comments and uploads use their own timestamps; this table keeps reaction times.
-- Rows older than 7 days are dropped.

create table if not exists public.bang_tin (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  photo_id text not null,
  ten text not null default '',
  noi_dung text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists bang_tin_created_at_idx
  on public.bang_tin (created_at desc);

alter table public.bang_tin enable row level security;

drop policy if exists "Public can read bang_tin" on public.bang_tin;
create policy "Public can read bang_tin"
  on public.bang_tin
  for select
  to anon, authenticated
  using (created_at > now() - interval '7 days');

drop policy if exists "Public can insert bang_tin" on public.bang_tin;
create policy "Public can insert bang_tin"
  on public.bang_tin
  for insert
  to anon, authenticated
  with check (
    kind in ('tim', 'binh_luan', 'anh')
    and char_length(photo_id) > 0
    and char_length(photo_id) <= 120
    and char_length(ten) <= 40
    and char_length(noi_dung) <= 160
  );

grant select, insert on public.bang_tin to anon, authenticated;

create or replace function public.quet_bang_tin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.bang_tin
  where created_at < now() - interval '7 days';
  return new;
end;
$$;

drop trigger if exists bang_tin_quet on public.bang_tin;
create trigger bang_tin_quet
after insert on public.bang_tin
for each row
execute procedure public.quet_bang_tin();
