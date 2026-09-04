-- ============================================================================
-- SmartSwachh — Initial schema, enums, indexes, RLS policies
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('citizen', 'admin', 'worker');
exception when duplicate_object then null; end $$;

do $$ begin
  create type report_status as enum ('pending', 'verified', 'assigned', 'in_progress', 'completed', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type severity_level as enum ('Low', 'Medium', 'High');
exception when duplicate_object then null; end $$;

do $$ begin
  create type worker_availability as enum ('available', 'busy', 'offline');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_status as enum ('assigned', 'accepted', 'in_progress', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type disposal_method as enum ('Recycling', 'Composting', 'Landfill', 'Hazardous Treatment', 'Other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_type as enum ('report', 'task', 'system');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- profiles  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'citizen',
  phone text,
  address text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
-- Role and full_name are passed in via signUp's `options.data`.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'citizen')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- waste_identifications  ("Identify My Waste")
-- ---------------------------------------------------------------------------
create table if not exists public.waste_identifications (
  id uuid primary key default uuid_generate_v4(),
  citizen_id uuid not null references public.profiles(id) on delete cascade,
  image_url text not null,
  waste_name text not null,
  category text not null,
  waste_type text not null,
  recommended_bin text not null,
  disposal_method text not null,
  ai_response jsonb not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- waste_reports  ("Report Garbage")
-- ---------------------------------------------------------------------------
create table if not exists public.waste_reports (
  id uuid primary key default uuid_generate_v4(),
  citizen_id uuid not null references public.profiles(id) on delete cascade,
  image_url text,
  description text not null,
  latitude double precision,
  longitude double precision,
  location_text text not null,
  problem_type text,
  waste_type text,
  category text,
  severity severity_level,
  final_priority severity_level,
  ai_analysis jsonb,
  status report_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_waste_reports_citizen on public.waste_reports(citizen_id);
create index if not exists idx_waste_reports_status on public.waste_reports(status);

-- ---------------------------------------------------------------------------
-- workers  (extends a profile with role = worker)
-- ---------------------------------------------------------------------------
create table if not exists public.workers (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  employee_code text not null unique,
  assigned_area text not null,
  availability worker_availability not null default 'available',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null references public.waste_reports(id) on delete cascade,
  worker_id uuid references public.workers(id) on delete set null,
  task_type text not null default 'Collection',
  priority severity_level not null default 'Medium',
  status task_status not null default 'assigned',
  before_image_url text,
  after_image_url text,
  disposal_method disposal_method,
  notes text,
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists idx_tasks_worker on public.tasks(worker_id);
create index if not exists idx_tasks_report on public.tasks(report_id);

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type notification_type not null default 'system',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user on public.notifications(user_id, read);

-- ---------------------------------------------------------------------------
-- updated_at trigger for waste_reports
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_waste_reports_updated_at on public.waste_reports;
create trigger trg_waste_reports_updated_at
  before update on public.waste_reports
  for each row execute procedure public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.waste_identifications enable row level security;
alter table public.waste_reports enable row level security;
alter table public.workers enable row level security;
alter table public.tasks enable row level security;
alter table public.notifications enable row level security;

-- Helper: current user's role, without recursive RLS lookups.
create or replace function public.current_role()
returns user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_worker_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.workers where profile_id = auth.uid();
$$;

-- ---- profiles ----
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.current_role() = 'admin');

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

-- ---- waste_identifications ----
create policy "wi_select_own_or_admin"
  on public.waste_identifications for select
  using (citizen_id = auth.uid() or public.current_role() = 'admin');

create policy "wi_insert_own"
  on public.waste_identifications for insert
  with check (citizen_id = auth.uid());

-- ---- waste_reports ----
create policy "wr_select_own_or_staff"
  on public.waste_reports for select
  using (
    citizen_id = auth.uid()
    or public.current_role() = 'admin'
    or exists (
      select 1 from public.tasks t
      where t.report_id = waste_reports.id
        and t.worker_id = public.current_worker_id()
    )
  );

create policy "wr_insert_own"
  on public.waste_reports for insert
  with check (citizen_id = auth.uid());

create policy "wr_update_admin_or_owner"
  on public.waste_reports for update
  using (public.current_role() = 'admin' or citizen_id = auth.uid());

-- ---- workers ----
create policy "workers_select_admin_or_self"
  on public.workers for select
  using (public.current_role() = 'admin' or profile_id = auth.uid());

create policy "workers_admin_manage"
  on public.workers for all
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ---- tasks ----
create policy "tasks_select_admin_or_assigned_worker"
  on public.tasks for select
  using (
    public.current_role() = 'admin'
    or worker_id = public.current_worker_id()
    or exists (
      select 1 from public.waste_reports r
      where r.id = tasks.report_id and r.citizen_id = auth.uid()
    )
  );

create policy "tasks_admin_insert"
  on public.tasks for insert
  with check (public.current_role() = 'admin');

create policy "tasks_update_admin_or_assigned_worker"
  on public.tasks for update
  using (public.current_role() = 'admin' or worker_id = public.current_worker_id());

-- ---- notifications ----
create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid());

create policy "notifications_insert_admin_or_system"
  on public.notifications for insert
  with check (true); -- inserted via server actions using service role, or by admin/worker flows

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('waste-images', 'waste-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('task-images', 'task-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Authenticated users may upload into these buckets; anyone may read (public buckets).
create policy "waste_images_insert_authenticated"
  on storage.objects for insert
  with check (bucket_id = 'waste-images' and auth.role() = 'authenticated');

create policy "task_images_insert_authenticated"
  on storage.objects for insert
  with check (bucket_id = 'task-images' and auth.role() = 'authenticated');

create policy "avatars_insert_authenticated"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

create policy "public_read_buckets"
  on storage.objects for select
  using (bucket_id in ('waste-images', 'task-images', 'avatars'));
