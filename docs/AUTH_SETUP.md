# Authentication setup (Supabase)

The dashboard runs in open **demo mode** until Supabase is configured. Once you
add the keys below, the app requires sign-in, and the **Admin → User
Management** page manages real accounts.

Admin actions (creating/removing users) run through serverless functions in
`/api`, so the Supabase **service-role key stays on the server** and is never
shipped to the browser.

---

## 1. Create a Supabase project

1. Go to <https://supabase.com> → **New project** (the free tier is fine).
2. Once it's ready, open **Project Settings → API** and copy:
   - **Project URL** (e.g. `https://abcd.supabase.co`)
   - **anon public** key
   - **service_role** key (secret — treat like a password)

## 2. Create the `profiles` table

Open **SQL Editor** in Supabase, paste this, and run it:

```sql
-- One row per user, linked to Supabase Auth.
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  full_name  text not null default '',
  role       text not null default 'advisor' check (role in ('admin','advisor')),
  firm       text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user can read their own profile.
create policy "read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins can read every profile.
create policy "admins read all"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));
```

> Writes (create/delete user) are done by the serverless functions using the
> service-role key, which bypasses RLS — so no insert/update/delete policies are
> needed for the app to work.

### `service_tasks` table (Service Progress tracker)

Also run this so the admin **Service Progress** board has a backend:

```sql
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

-- Admins can read all tasks (writes go through the service-role API).
create policy "admins read tasks"
  on public.service_tasks for select
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));
```

## 3. Add environment variables

Add these in **Vercel → Project → Settings → Environment Variables** (and to a
local `.env.local` if running locally). See `.env.example`.

| Name | Value | Exposed to browser? |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Project URL | yes |
| `VITE_SUPABASE_ANON_KEY` | anon public key | yes |
| `VITE_ADMIN_EMAIL` | `bernard@teamcerium.com` | yes |
| `SUPABASE_URL` | Project URL | no |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key | **no — keep secret** |
| `ADMIN_EMAIL` | `bernard@teamcerium.com` | no |

Redeploy after adding them.

## 4. First login (create the admin)

1. Visit the site → you'll be sent to `/login`.
2. Because no admin exists yet, it shows **"Create your admin account"** for
   `bernard@teamcerium.com`. Choose a password (8+ characters).
3. You're signed in as admin. Open **User Management** in the sidebar to add
   advisors and teammates. Each new user gets a one-time temporary password to
   share; they sign in and can change it.

## How it fits together

- `src/lib/supabase.ts` — browser client + `isAuthEnabled` flag (demo vs real).
- `src/state/Auth.tsx` — session/role context; falls back to a demo admin when
  unconfigured.
- `src/pages/Login.tsx` — sign-in + first-run admin bootstrap.
- `src/pages/admin/Users.tsx` — admin user management UI.
- `src/pages/admin/Progress.tsx` + `src/lib/tasksApi.ts` — Service Progress board.
- `api/auth/status.ts` — has the admin been created yet?
- `api/auth/bootstrap-admin.ts` — one-time admin creation.
- `api/admin/users.ts` — list / create / delete users (admin-only).
- `api/admin/tasks.ts` — list / create / update / delete service tasks (admin-only).
