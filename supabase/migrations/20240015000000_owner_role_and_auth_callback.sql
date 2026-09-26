-- ============================================================
-- 0015 — Owner role for lfefl1998@gmail.com
-- ============================================================
-- Updates handle_new_user() so that the designated owner email
-- automatically receives role='owner'. Idempotent: re-running
-- this migration does not change other users' roles.

-- Update the trigger function to auto-assign 'owner' to the known email
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
    case when new.email = 'lfefl1998@gmail.com' then 'owner'::user_role
         else 'admin'::user_role
    end
  )
  on conflict (id) do update set
    role = case
      when new.email = 'lfefl1998@gmail.com' then 'owner'::user_role
      else excluded.role
    end;
  return new;
end;
$$;

-- Promote existing profile if the user already exists in auth.users
do $$
declare
  v_uid uuid;
begin
  select id into v_uid from auth.users where email = 'lfefl1998@gmail.com' limit 1;
  if v_uid is not null then
    update profiles
    set role = 'owner', active = true, updated_at = now()
    where id = v_uid;
  end if;
end;
$$;
