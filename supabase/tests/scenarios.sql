-- Functional smoke test for the RLS policies. Not part of the real
-- migration set. Run as postgres (superuser) so we can freely switch
-- `role` and the `request.jwt.claim.sub` GUC to impersonate different users.

\set ON_ERROR_STOP on

-- public.profiles rows are created by the on_auth_user_created trigger.
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'alice@example.com'),
  ('00000000-0000-0000-0000-000000000002', 'bob@example.com');

-- Alice creates a private story.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

insert into public.stories (id, title, created_by, updated_by, visibility)
values ('10000000-0000-0000-0000-000000000001', 'Alice private story', auth.uid(), auth.uid(), 'private');

insert into public.story_slides (story_id, order_index, blocks)
values ('10000000-0000-0000-0000-000000000001', 0, '[{"type":"heading","text":"Hello"}]'::jsonb);
commit;

-- Bob (authenticated, unrelated) should NOT see Alice's private story.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';

do $$
declare
  cnt integer;
begin
  select count(*) into cnt from public.stories where id = '10000000-0000-0000-0000-000000000001';
  assert cnt = 0, 'FAIL: bob should not see alice''s private story';
  raise notice 'PASS: bob cannot see alice''s private story';
end
$$;
commit;

-- Bob should not be able to insert a story impersonating alice as creator.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';

do $$
begin
  begin
    insert into public.stories (title, created_by, updated_by, visibility)
    values ('should fail', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'private');
    raise exception 'FAIL: bob inserted a story as alice';
  exception
    when insufficient_privilege or others then
      raise notice 'PASS: bob cannot insert a story as alice (%)', sqlerrm;
  end;
end
$$;
rollback;

-- Alice adds bob as a viewer.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

insert into public.story_members (story_id, user_id, role)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'viewer');
commit;

-- Now bob (viewer) can read the story and its slides, but not edit them.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';

do $$
declare
  cnt integer;
begin
  select count(*) into cnt from public.stories where id = '10000000-0000-0000-0000-000000000001';
  assert cnt = 1, 'FAIL: viewer bob should see the story now';
  select count(*) into cnt from public.story_slides where story_id = '10000000-0000-0000-0000-000000000001';
  assert cnt = 1, 'FAIL: viewer bob should see the slide';
  raise notice 'PASS: viewer bob can read the shared story and its slides';
end
$$;

update public.stories set title = 'hacked' where id = '10000000-0000-0000-0000-000000000001';
do $$
begin
  if (select title from public.stories where id = '10000000-0000-0000-0000-000000000001') = 'hacked' then
    raise exception 'FAIL: viewer bob updated the story title';
  else
    raise notice 'PASS: viewer bob''s update was blocked by RLS';
  end if;
end
$$;

-- Bob (viewer) can comment.
insert into public.comments (story_id, author_id, text)
values ('10000000-0000-0000-0000-000000000001', auth.uid(), 'Nice story!');
commit;

-- An anonymous (unauthenticated) visitor should NOT see the private story,
-- even though they know its id.
begin;
set local role anon;

do $$
declare
  cnt integer;
begin
  select count(*) into cnt from public.stories where id = '10000000-0000-0000-0000-000000000001';
  assert cnt = 0, 'FAIL: anon should not see the private/team-only story';
  raise notice 'PASS: anon cannot see the private story';
end
$$;
commit;

-- Alice publishes a share link -> now anon CAN read the story.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';

insert into public.share_links (story_id, slug, visibility, created_by)
values ('10000000-0000-0000-0000-000000000001', 'alice-story', 'link', auth.uid());
commit;

begin;
set local role anon;

do $$
declare
  cnt integer;
begin
  select count(*) into cnt from public.stories where id = '10000000-0000-0000-0000-000000000001';
  assert cnt = 1, 'FAIL: anon should see the story once a share link exists';
  select count(*) into cnt from public.story_slides where story_id = '10000000-0000-0000-0000-000000000001';
  assert cnt = 1, 'FAIL: anon should see slides of a shared story';
  raise notice 'PASS: anon can read the story and slides via an active share link';
end
$$;
commit;

-- Alice deactivates the link -> anon loses access again.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
update public.share_links set is_active = false where slug = 'alice-story';
commit;

begin;
set local role anon;
do $$
declare
  cnt integer;
begin
  select count(*) into cnt from public.stories where id = '10000000-0000-0000-0000-000000000001';
  assert cnt = 0, 'FAIL: anon should lose access once the share link is deactivated';
  raise notice 'PASS: deactivating the share link revokes anon access';
end
$$;
commit;

-- Storage: objects are keyed as stories/<story_id>/<file>, and access is
-- derived from that path (see supabase/migrations/20260902020000_storage.sql)
-- since the public.media row doesn't exist yet at upload time. The 'media'
-- bucket itself was already created by that migration.

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
insert into storage.objects (bucket_id, name)
values ('media', 'stories/10000000-0000-0000-0000-000000000001/photo1.jpg');
commit;

do $$
begin
  raise notice 'PASS: owner alice can upload a storage object for her story';
end
$$;

-- Bob is a viewer on this story (added earlier) — viewers cannot upload.
-- An INSERT that fails WITH CHECK raises an error (unlike UPDATE, which
-- just matches zero rows), so this has to be caught explicitly.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
do $$
begin
  begin
    insert into storage.objects (bucket_id, name)
    values ('media', 'stories/10000000-0000-0000-0000-000000000001/photo2.jpg');
    raise exception 'FAIL: viewer bob uploaded a storage object';
  exception
    when insufficient_privilege or others then
      raise notice 'PASS: viewer bob cannot upload a storage object (%)', sqlerrm;
  end;
end
$$;
rollback;

-- Bob (viewer) can still read the object alice uploaded.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
do $$
declare
  cnt integer;
begin
  select count(*) into cnt from storage.objects where name = 'stories/10000000-0000-0000-0000-000000000001/photo1.jpg';
  assert cnt = 1, 'FAIL: viewer bob should be able to read the story''s storage object';
  raise notice 'PASS: viewer bob can read the story''s storage object';
end
$$;
commit;

-- The share link was deactivated earlier in this script, so anon should
-- not be able to read the storage object either.
begin;
set local role anon;
do $$
declare
  cnt integer;
begin
  select count(*) into cnt from storage.objects where name = 'stories/10000000-0000-0000-0000-000000000001/photo1.jpg';
  assert cnt = 0, 'FAIL: anon should not read a storage object for a private story';
  raise notice 'PASS: anon cannot read the storage object while the story has no active share link';
end
$$;
commit;

-- Owner deletes the object; a viewer may not.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
delete from storage.objects where name = 'stories/10000000-0000-0000-0000-000000000001/photo1.jpg';
do $$
begin
  if (select count(*) from storage.objects where name = 'stories/10000000-0000-0000-0000-000000000001/photo1.jpg') = 1 then
    raise notice 'PASS: viewer bob cannot delete the storage object';
  else
    raise exception 'FAIL: viewer bob deleted the storage object';
  end if;
end
$$;
rollback;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
delete from storage.objects where name = 'stories/10000000-0000-0000-0000-000000000001/photo1.jpg';
do $$
begin
  if (select count(*) from storage.objects where name = 'stories/10000000-0000-0000-0000-000000000001/photo1.jpg') = 0 then
    raise notice 'PASS: owner alice can delete the storage object';
  else
    raise exception 'FAIL: owner alice could not delete the storage object';
  end if;
end
$$;
commit;

-- search_stories(): matches by title (RLS still applies per row — a
-- matching title does not leak a story to someone with no access to it).
insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000003', 'charlie@example.com');

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
do $$
declare
  cnt integer;
begin
  select count(*) into cnt from public.search_stories('private');
  assert cnt = 1, 'FAIL: owner alice should find her story by title';
  raise notice 'PASS: owner alice finds her story via search_stories() by title';
end
$$;
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000002';
do $$
declare
  cnt integer;
begin
  select count(*) into cnt from public.search_stories('private');
  assert cnt = 1, 'FAIL: viewer bob (has access) should find the story too';
  raise notice 'PASS: viewer bob finds the shared story via search_stories()';
end
$$;
commit;

begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000003';
do $$
declare
  cnt integer;
begin
  select count(*) into cnt from public.search_stories('private');
  assert cnt = 0, 'FAIL: charlie has no access — a title match must not leak the story to him';
  raise notice 'PASS: search_stories() does not leak a story charlie has no access to';
end
$$;
commit;

-- Tag search.
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
insert into public.tags (id, name) values ('20000000-0000-0000-0000-000000000001', 'seeds');
insert into public.story_tags (story_id, tag_id)
values ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001');
do $$
declare
  cnt integer;
begin
  select count(*) into cnt from public.search_stories('seeds');
  assert cnt = 1, 'FAIL: owner alice should find her story by tag name';
  raise notice 'PASS: owner alice finds her story via search_stories() by tag';
end
$$;
commit;

-- find_user_by_email(): exact-match lookup for team invites, no
-- enumeration (matches only when the caller already knows the email).
begin;
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
do $$
declare
  found_id uuid;
begin
  select id into found_id from public.find_user_by_email('bob@example.com');
  assert found_id = '00000000-0000-0000-0000-000000000002', 'FAIL: should find bob by exact email';
  raise notice 'PASS: find_user_by_email() finds bob by exact email match';

  select id into found_id from public.find_user_by_email('nobody@example.com');
  assert found_id is null, 'FAIL: should find nobody for an unknown email';
  raise notice 'PASS: find_user_by_email() returns nothing for an unknown email';
end
$$;
commit;

do $$
begin
  raise notice 'ALL SCENARIO CHECKS PASSED';
end
$$;
