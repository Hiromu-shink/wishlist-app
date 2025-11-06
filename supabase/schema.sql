create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  price numeric,
  url text,
  image_url text,
  comment text,
  deadline date,
  priority int2 not null default 3 check (priority between 1 and 5),
  is_purchased boolean not null default false,
  purchased_date date,
  month text not null,
  created_at timestamptz not null default now()
);

alter table public.wishlist enable row level security;

create policy "users can read own" on public.wishlist
  for select using (auth.uid() = user_id);

-- Allow public (anon) read access to wishlist items
create policy if not exists "public can read wishlist" on public.wishlist
  for select using (true);

create policy "users can insert own" on public.wishlist
  for insert with check (auth.uid() = user_id);

create policy "users can update own" on public.wishlist
  for update using (auth.uid() = user_id);

create policy "users can delete own" on public.wishlist
  for delete using (auth.uid() = user_id);

-- Helpful index for month filtering and ordering
create index if not exists idx_wishlist_user_month on public.wishlist(user_id, month);

-- Anonymous usage (no auth): relax constraints and policies
-- Make user_id nullable and drop FK if present
alter table if exists public.wishlist alter column user_id drop not null;
alter table if exists public.wishlist drop constraint if exists wishlist_user_id_fkey;

-- Public write policies (anyone can insert/update/delete)
drop policy if exists "public can insert wishlist" on public.wishlist;
create policy "public can insert wishlist" on public.wishlist
  for insert with check (true);

drop policy if exists "public can update wishlist" on public.wishlist;
create policy "public can update wishlist" on public.wishlist
  for update using (true);

drop policy if exists "public can delete wishlist" on public.wishlist;
create policy "public can delete wishlist" on public.wishlist
  for delete using (true);

-- Add is_someday column for "someday" wishlist items
alter table if exists public.wishlist add column if not exists is_someday boolean not null default false;

