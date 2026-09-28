-- Paste this in Supabase → SQL → New query → Run.
-- Public comments on each photo. No login.

create table if not exists public.binh_luan (
  id uuid primary key default gen_random_uuid(),
  photo_id text not null,
  ten text not null default '',
  noi_dung text not null,
  created_at timestamptz not null default now()
);

create index if not exists binh_luan_photo_id_created_at_idx
  on public.binh_luan (photo_id, created_at);

alter table public.binh_luan enable row level security;

drop policy if exists "Public can read binh_luan" on public.binh_luan;
create policy "Public can read binh_luan"
  on public.binh_luan
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can insert binh_luan" on public.binh_luan;
create policy "Public can insert binh_luan"
  on public.binh_luan
  for insert
  to anon, authenticated
  with check (
    char_length(trim(noi_dung)) > 0
    and char_length(noi_dung) <= 500
    and char_length(ten) <= 40
  );

grant select, insert on public.binh_luan to anon, authenticated;
