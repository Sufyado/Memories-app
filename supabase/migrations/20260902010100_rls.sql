-- Row Level Security for Vistoria.
-- Run after 20260902010000_schema.sql.
--
-- Access model:
--   Owner  (stories.created_by, or story_members.role = 'owner') — full control.
--   Editor (story_members.role = 'editor')                       — read + edit content.
--   Viewer (story_members.role = 'viewer')                       — read + comment.
--   An active row in share_links makes a story (and its slides/media/tags)
--   readable to anyone, authenticated or not — this is what a "public" or
--   "link access" share actually means, so nothing here depends on hiding IDs.

-- ---------------------------------------------------------------------------
-- Helper functions (security definer so they can read story_members /
-- share_links without recursing through those tables' own RLS policies).
-- ---------------------------------------------------------------------------
create or replace function public.story_role(p_story_id uuid, p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1 from public.stories s where s.id = p_story_id and s.created_by = p_user_id
    ) then 'owner'
    else (
      select sm.role from public.story_members sm
      where sm.story_id = p_story_id and sm.user_id = p_user_id
    )
  end;
$$;

create or replace function public.story_is_shared_public(p_story_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.share_links sl
    where sl.story_id = p_story_id and sl.is_active = true
  );
$$;

grant execute on function public.story_role(uuid, uuid) to authenticated, anon;
grant execute on function public.story_is_shared_public(uuid) to authenticated, anon;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles select" on public.profiles
  for select to authenticated using (true);

create policy "profiles insert own" on public.profiles
  for insert to authenticated with check (id = auth.uid());

create policy "profiles update own" on public.profiles
  for update to authenticated using (id = auth.uid());

-- ---------------------------------------------------------------------------
-- folders (owner-only in V1)
-- ---------------------------------------------------------------------------
alter table public.folders enable row level security;

create policy "folders select own" on public.folders
  for select to authenticated using (created_by = auth.uid());

create policy "folders insert own" on public.folders
  for insert to authenticated with check (created_by = auth.uid());

create policy "folders update own" on public.folders
  for update to authenticated using (created_by = auth.uid());

create policy "folders delete own" on public.folders
  for delete to authenticated using (created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- stories
-- ---------------------------------------------------------------------------
alter table public.stories enable row level security;

create policy "stories select" on public.stories
  for select to authenticated, anon
  using (
    created_by = auth.uid()
    or public.story_role(id, auth.uid()) is not null
    or public.story_is_shared_public(id)
  );

create policy "stories insert" on public.stories
  for insert to authenticated with check (created_by = auth.uid());

create policy "stories update" on public.stories
  for update to authenticated
  using (created_by = auth.uid() or public.story_role(id, auth.uid()) in ('owner', 'editor'));

create policy "stories delete" on public.stories
  for delete to authenticated
  using (created_by = auth.uid() or public.story_role(id, auth.uid()) = 'owner');

-- ---------------------------------------------------------------------------
-- story_slides
-- ---------------------------------------------------------------------------
alter table public.story_slides enable row level security;

create policy "slides select" on public.story_slides
  for select to authenticated, anon
  using (
    exists (
      select 1 from public.stories s
      where s.id = story_slides.story_id
        and (
          s.created_by = auth.uid()
          or public.story_role(s.id, auth.uid()) is not null
          or public.story_is_shared_public(s.id)
        )
    )
  );

create policy "slides manage" on public.story_slides
  for all to authenticated
  using (
    exists (
      select 1 from public.stories s
      where s.id = story_slides.story_id
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) in ('owner', 'editor'))
    )
  )
  with check (
    exists (
      select 1 from public.stories s
      where s.id = story_slides.story_id
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) in ('owner', 'editor'))
    )
  );

-- ---------------------------------------------------------------------------
-- media
-- ---------------------------------------------------------------------------
alter table public.media enable row level security;

create policy "media select" on public.media
  for select to authenticated, anon
  using (
    exists (
      select 1 from public.stories s
      where s.id = media.story_id
        and (
          s.created_by = auth.uid()
          or public.story_role(s.id, auth.uid()) is not null
          or public.story_is_shared_public(s.id)
        )
    )
  );

create policy "media manage" on public.media
  for all to authenticated
  using (
    exists (
      select 1 from public.stories s
      where s.id = media.story_id
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) in ('owner', 'editor'))
    )
  )
  with check (
    exists (
      select 1 from public.stories s
      where s.id = media.story_id
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) in ('owner', 'editor'))
    )
  );

-- ---------------------------------------------------------------------------
-- tags / story_tags
-- ---------------------------------------------------------------------------
alter table public.tags enable row level security;

create policy "tags select" on public.tags
  for select to authenticated, anon using (true);

create policy "tags insert" on public.tags
  for insert to authenticated with check (true);

alter table public.story_tags enable row level security;

create policy "story_tags select" on public.story_tags
  for select to authenticated, anon
  using (
    exists (
      select 1 from public.stories s
      where s.id = story_tags.story_id
        and (
          s.created_by = auth.uid()
          or public.story_role(s.id, auth.uid()) is not null
          or public.story_is_shared_public(s.id)
        )
    )
  );

create policy "story_tags manage" on public.story_tags
  for all to authenticated
  using (
    exists (
      select 1 from public.stories s
      where s.id = story_tags.story_id
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) in ('owner', 'editor'))
    )
  )
  with check (
    exists (
      select 1 from public.stories s
      where s.id = story_tags.story_id
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) in ('owner', 'editor'))
    )
  );

-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------
alter table public.comments enable row level security;

create policy "comments select" on public.comments
  for select to authenticated, anon
  using (
    exists (
      select 1 from public.stories s
      where s.id = comments.story_id
        and (
          s.created_by = auth.uid()
          or public.story_role(s.id, auth.uid()) is not null
          or public.story_is_shared_public(s.id)
        )
    )
  );

create policy "comments insert" on public.comments
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.stories s
      where s.id = comments.story_id
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) is not null)
    )
  );

create policy "comments update own" on public.comments
  for update to authenticated using (author_id = auth.uid());

create policy "comments delete own or story owner" on public.comments
  for delete to authenticated
  using (
    author_id = auth.uid()
    or exists (select 1 from public.stories s where s.id = comments.story_id and s.created_by = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- story_members (only the story owner manages membership)
-- ---------------------------------------------------------------------------
alter table public.story_members enable row level security;

create policy "story_members select" on public.story_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.stories s where s.id = story_members.story_id and s.created_by = auth.uid())
  );

create policy "story_members manage" on public.story_members
  for all to authenticated
  using (exists (select 1 from public.stories s where s.id = story_members.story_id and s.created_by = auth.uid()))
  with check (exists (select 1 from public.stories s where s.id = story_members.story_id and s.created_by = auth.uid()));

-- ---------------------------------------------------------------------------
-- share_links
-- ---------------------------------------------------------------------------
alter table public.share_links enable row level security;

create policy "share_links select" on public.share_links
  for select to authenticated, anon
  using (is_active = true or created_by = auth.uid());

create policy "share_links manage" on public.share_links
  for all to authenticated
  using (
    created_by = auth.uid()
    or exists (
      select 1 from public.stories s
      where s.id = share_links.story_id
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) in ('owner', 'editor'))
    )
  )
  with check (
    created_by = auth.uid()
    or exists (
      select 1 from public.stories s
      where s.id = share_links.story_id
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) in ('owner', 'editor'))
    )
  );

-- ---------------------------------------------------------------------------
-- story_versions
-- ---------------------------------------------------------------------------
alter table public.story_versions enable row level security;

create policy "story_versions select" on public.story_versions
  for select to authenticated
  using (
    exists (
      select 1 from public.stories s
      where s.id = story_versions.story_id
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) is not null)
    )
  );

create policy "story_versions insert" on public.story_versions
  for insert to authenticated
  with check (
    exists (
      select 1 from public.stories s
      where s.id = story_versions.story_id
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) in ('owner', 'editor'))
    )
  );

-- ---------------------------------------------------------------------------
-- activity_log
-- ---------------------------------------------------------------------------
alter table public.activity_log enable row level security;

create policy "activity_log select" on public.activity_log
  for select to authenticated
  using (
    exists (
      select 1 from public.stories s
      where s.id = activity_log.story_id
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) is not null)
    )
  );

create policy "activity_log insert" on public.activity_log
  for insert to authenticated
  with check (
    actor_id = auth.uid()
    and exists (
      select 1 from public.stories s
      where s.id = activity_log.story_id
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) is not null)
    )
  );
