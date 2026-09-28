-- Paste this in Supabase → SQL → New query → Run.
-- Counts hearts and views per photo. No IP limit.

create table if not exists public.anh_dem (
  photo_id text primary key,
  hearts integer not null default 0,
  views integer not null default 0
);

alter table public.anh_dem enable row level security;

drop policy if exists "Public can read anh_dem" on public.anh_dem;
create policy "Public can read anh_dem"
  on public.anh_dem
  for select
  to anon, authenticated
  using (true);

grant select on public.anh_dem to anon, authenticated;

create or replace function public.cong_tim(p_photo_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  insert into public.anh_dem (photo_id, hearts, views)
  values (p_photo_id, 1, 0)
  on conflict (photo_id)
  do update set hearts = public.anh_dem.hearts + 1
  returning hearts into n;
  return n;
end;
$$;

create or replace function public.cong_xem(p_photo_id text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  insert into public.anh_dem (photo_id, hearts, views)
  values (p_photo_id, 0, 1)
  on conflict (photo_id)
  do update set views = public.anh_dem.views + 1
  returning views into n;
  return n;
end;
$$;

grant execute on function public.cong_tim(text) to anon, authenticated;
grant execute on function public.cong_xem(text) to anon, authenticated;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'nhatky'
  ) then
    insert into public.anh_dem (photo_id, views)
    select target, count(*)::integer
    from public.nhatky
    where kind = 'photo'
      and target is not null
      and target <> ''
    group by target
    on conflict (photo_id)
    do update set views = greatest(public.anh_dem.views, excluded.views);
  end if;
end $$;
