-- Push購読を保存
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null unique,
  auth text not null,
  p256dh text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

create policy if not exists "push_subscriptions_select_own" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy if not exists "push_subscriptions_upsert_own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy if not exists "push_subscriptions_update_own" on public.push_subscriptions
  for update using (auth.uid() = user_id);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id);

-- 通知設定
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  notify_deadline boolean not null default true,
  notify_budget boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

create policy if not exists "notification_prefs_select_own" on public.notification_preferences
  for select using (auth.uid() = user_id);

create policy if not exists "notification_prefs_upsert_own" on public.notification_preferences
  for insert with check (auth.uid() = user_id);

create policy if not exists "notification_prefs_update_own" on public.notification_preferences
  for update using (auth.uid() = user_id);

-- 月別予算
create table if not exists public.budget_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  month text not null, -- YYYY-MM
  amount numeric not null,
  created_at timestamptz not null default now()
);

alter table public.budget_limits enable row level security;

create policy if not exists "budget_limits_select_own" on public.budget_limits
  for select using (auth.uid() = user_id);

create policy if not exists "budget_limits_upsert_own" on public.budget_limits
  for insert with check (auth.uid() = user_id);

create policy if not exists "budget_limits_update_own" on public.budget_limits
  for update using (auth.uid() = user_id);

create index if not exists idx_budget_limits_user_month on public.budget_limits(user_id, month);

