-- ============================================================
-- 0002 — Profiles & Security Helpers
-- ============================================================
-- Extends auth.users with application-level profile data.
-- Security functions use SECURITY DEFINER with fixed search_path
-- to avoid privilege escalation and RLS recursion.

-- ── profiles ─────────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text        not null default '',
  role        user_role   not null default 'admin',
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table profiles is 'Application-level user profile. One row per auth.users row.';
comment on column profiles.role is 'owner = full control including profile management; admin = store operations';
comment on column profiles.active is 'Inactive profiles cannot access the dashboard even with a valid session';

-- Auto-create profile when a new auth user is added
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'admin'  -- default role; owner must be promoted manually
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-update updated_at on profiles
create or replace function touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure touch_updated_at();

-- ── Security helper functions ─────────────────────────────────
-- These are called in RLS policies.
-- SECURITY DEFINER + fixed search_path prevents malicious overrides.
-- get_my_profile() uses a direct lookup bypassing RLS on profiles
-- to avoid infinite recursion in the profiles RLS policy itself.

create or replace function get_my_profile()
returns profiles
language sql
stable
security definer
set search_path = public
as $$
  select * from profiles where id = auth.uid() limit 1;
$$;

create or replace function is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and active = true
      and role in ('admin', 'owner')
  );
$$;

create or replace function is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and active = true
      and role = 'owner'
  );
$$;

-- Revoke public execute; grant only to authenticated users
revoke execute on function get_my_profile() from public;
revoke execute on function is_active_admin() from public;
revoke execute on function is_owner() from public;

grant execute on function get_my_profile() to authenticated;
grant execute on function is_active_admin() to authenticated;
grant execute on function is_owner() to authenticated;

-- ── RLS on profiles ───────────────────────────────────────────
alter table profiles enable row level security;

-- Users can read their own profile
create policy "profiles_select_own"
  on profiles for select
  to authenticated
  using (id = auth.uid());

-- Owners can read all profiles
create policy "profiles_select_owner"
  on profiles for select
  to authenticated
  using (is_owner());

-- Users can update only their own non-sensitive fields (NOT role, NOT active)
create policy "profiles_update_own_name"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from profiles where id = auth.uid())
    and active = (select active from profiles where id = auth.uid())
  );

-- Only owners can update other profiles (role, active)
create policy "profiles_update_owner"
  on profiles for update
  to authenticated
  using (is_owner())
  with check (
    -- Prevent the last owner from demoting themselves
    not (
      role != 'owner'
      and (select role from profiles where id = auth.uid()) = 'owner'
      and (select count(*) from profiles where role = 'owner' and active = true) <= 1
    )
  );

-- No one can delete profiles through the API (cascade handles auth.users deletion)
create policy "profiles_no_delete"
  on profiles for delete
  to authenticated
  using (false);

-- Anon cannot touch profiles at all
