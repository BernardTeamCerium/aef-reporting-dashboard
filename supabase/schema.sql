-- OneStop Advisor Marketing Hub — Supabase schema
-- Run this once in your Supabase project: SQL Editor → paste → Run.
-- Safe to re-run (uses "if not exists" / "drop policy if exists").

-- ---------------------------------------------------------------------------
-- profiles: one row per login, linked to Supabase Auth. Drives roles.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text not null default '',
  role       text not null default 'advisor' check (role in ('admin','advisor')),
  firm       text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- ---------------------------------------------------------------------------
-- service_tasks: the admin Service Progress board.
-- ---------------------------------------------------------------------------
create table if not exists public.service_tasks (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  client       text not null,
  category     text not null default 'Content'
                 check (category in ('Content','Print','Website','SEO','Strategy')),
  status       text not null default 'todo'
                 check (status in ('todo','in_progress','done')),
  assignee     text,
  due_date     date,
  completed_at date,
  created_at   timestamptz not null default now()
);

alter table public.service_tasks enable row level security;

drop policy if exists "admins read tasks" on public.service_tasks;
create policy "admins read tasks"
  on public.service_tasks for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

-- Note: create/update/delete for users and tasks go through the serverless
-- functions in /api using the service-role key, which bypasses RLS. That's why
-- only SELECT policies are needed here.
