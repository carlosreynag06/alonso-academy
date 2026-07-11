alter table public.child_profiles
  add column auth_user_id uuid unique references auth.users(id) on delete restrict;

create or replace function private.is_child()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.child_profiles child
    where child.auth_user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_child() from public, anon;
grant execute on function private.is_child() to authenticated;

create or replace function public.get_current_child_profile()
returns public.child_profiles
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  profile public.child_profiles;
begin
  select * into profile from public.child_profiles
  where auth_user_id = (select auth.uid());
  if profile.id is null then
    raise exception 'Child access is not authorized';
  end if;
  return profile;
end;
$$;

revoke all on function public.get_current_child_profile() from public, anon;
grant execute on function public.get_current_child_profile() to authenticated;

comment on column public.child_profiles.auth_user_id is 'The single Supabase password user authorized to enter Alonso mode.';
