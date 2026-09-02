-- Two fixes needed for Phase 7 (sharing/team):
--
-- 1. The Phase 2 RLS policies only granted public-link read access to the
--    `anon` role. A signed-in user who is NOT a member of the story (just
--    someone else with an account, following a public link) was denied —
--    "public" must mean anyone, logged in or not. Add matching policies
--    for `authenticated`; they're additive/permissive alongside the
--    existing "members read ..." policies, so membership access is
--    unaffected.
--
-- 2. Inviting a team member by email (story_members) needs a way to look
--    up a user by email. profiles has no email column today, so mirror
--    auth.users.email onto it at signup time.

alter table public.profiles add column email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
  );
  return new;
end;
$$;

create policy "authenticated users read public shared stories"
  on public.stories for select
  to authenticated
  using (public.is_story_public(id));

create policy "authenticated users read public shared slides"
  on public.story_slides for select
  to authenticated
  using (public.is_story_public(story_id));

create policy "authenticated users read public shared media"
  on public.media for select
  to authenticated
  using (public.is_story_public(story_id));

create policy "authenticated users read public shared story tags"
  on public.story_tags for select
  to authenticated
  using (public.is_story_public(story_id));

create policy "authenticated users read public shared media objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'story-media'
    and public.is_story_public((storage.foldername(name))[1]::uuid)
  );
