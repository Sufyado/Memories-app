-- Lets a story owner invite an existing user by email without exposing
-- every user's email to every authenticated user (which broadening the
-- existing "profiles select" policy to include email would do). Only an
-- exact-match point lookup is possible — no enumeration.

create or replace function public.find_user_by_email(lookup_email text)
returns table (id uuid, display_name text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.display_name
  from public.profiles p
  join auth.users u on u.id = p.id
  where u.email = lookup_email
  limit 1;
$$;

grant execute on function public.find_user_by_email(text) to authenticated;
