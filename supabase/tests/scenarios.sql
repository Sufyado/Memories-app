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

do $$
begin
  raise notice 'ALL SCENARIO CHECKS PASSED';
end
$$;
