-- Supabase dashboard schema and RLS policies

create extension if not exists pgcrypto;

-- Roles used by the app in JWT claims (app_metadata.role)
-- admin: internal staff
-- client: external client-facing users

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null check (role in ('admin', 'client')),
  client_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  active boolean not null default true,
  dashboard_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_client_id_fkey
  foreign key (client_id) references public.clients(id)
  on delete set null;

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  channel text,
  status text,
  start_date date,
  end_date date,
  client_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  lead_date date not null,
  source text,
  quality text,
  value numeric(12,2),
  client_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.ad_spend (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  spend_date date not null,
  platform text,
  amount numeric(12,2) not null default 0,
  client_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  appointment_date timestamptz not null,
  status text,
  revenue numeric(12,2),
  client_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.vendor_costs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  cost_date date not null,
  vendor_name text,
  category text,
  amount numeric(12,2) not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.client_billing (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  billing_date date not null,
  amount numeric(12,2) not null,
  status text,
  invoice_number text,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete set null,
  name text not null,
  status text,
  budget numeric(12,2),
  labor_cost numeric(12,2),
  margin numeric(12,2),
  client_visible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  note text not null,
  is_internal boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_client_id on public.profiles(client_id);
create index if not exists idx_campaigns_client_id on public.campaigns(client_id);
create index if not exists idx_leads_client_id on public.leads(client_id);
create index if not exists idx_ad_spend_client_id on public.ad_spend(client_id);
create index if not exists idx_appointments_client_id on public.appointments(client_id);
create index if not exists idx_vendor_costs_client_id on public.vendor_costs(client_id);
create index if not exists idx_client_billing_client_id on public.client_billing(client_id);
create index if not exists idx_projects_client_id on public.projects(client_id);
create index if not exists idx_campaign_notes_client_id on public.campaign_notes(client_id);

-- Helper functions for RLS
create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role'), 'client');
$$;

create or replace function public.current_user_client_id()
returns uuid
language sql
stable
as $$
  select p.client_id
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'admin';
$$;

create or replace function public.is_client_approved(client_uuid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.clients c
    where c.id = client_uuid
      and c.dashboard_approved = true
  );
$$;

-- Enable RLS across all tables
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.campaigns enable row level security;
alter table public.leads enable row level security;
alter table public.ad_spend enable row level security;
alter table public.appointments enable row level security;
alter table public.vendor_costs enable row level security;
alter table public.client_billing enable row level security;
alter table public.projects enable row level security;
alter table public.campaign_notes enable row level security;

-- Admin full access policies
create policy profiles_admin_all on public.profiles
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy clients_admin_all on public.clients
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy campaigns_admin_all on public.campaigns
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy leads_admin_all on public.leads
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy ad_spend_admin_all on public.ad_spend
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy appointments_admin_all on public.appointments
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy vendor_costs_admin_all on public.vendor_costs
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy client_billing_admin_all on public.client_billing
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy projects_admin_all on public.projects
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy campaign_notes_admin_all on public.campaign_notes
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

-- Client visibility policies
create policy profiles_client_self on public.profiles
for select to authenticated
using (id = auth.uid());

create policy clients_client_read_approved on public.clients
for select to authenticated
using (
  public.current_user_role() = 'client'
  and id = public.current_user_client_id()
  and dashboard_approved = true
);

create policy campaigns_client_read on public.campaigns
for select to authenticated
using (
  public.current_user_role() = 'client'
  and client_id = public.current_user_client_id()
  and client_visible = true
  and public.is_client_approved(client_id)
);

create policy leads_client_read on public.leads
for select to authenticated
using (
  public.current_user_role() = 'client'
  and client_id = public.current_user_client_id()
  and client_visible = true
  and public.is_client_approved(client_id)
);

create policy ad_spend_client_read on public.ad_spend
for select to authenticated
using (
  public.current_user_role() = 'client'
  and client_id = public.current_user_client_id()
  and client_visible = true
  and public.is_client_approved(client_id)
);

create policy appointments_client_read on public.appointments
for select to authenticated
using (
  public.current_user_role() = 'client'
  and client_id = public.current_user_client_id()
  and client_visible = true
  and public.is_client_approved(client_id)
);

create policy client_billing_client_read on public.client_billing
for select to authenticated
using (
  public.current_user_role() = 'client'
  and client_id = public.current_user_client_id()
  and public.is_client_approved(client_id)
);

-- Internal tables blocked for client users by omitting client policies:
-- vendor_costs, projects (contains labor_cost/margin), campaign_notes.
