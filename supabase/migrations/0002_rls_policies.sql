-- Row Level Security for Vistoria.
-- Access model per story:
--   - owner_id = auth.uid()                              -> full access
--   - story_members role = 'editor'                       -> read + write content
--   - story_members role = 'viewer'                        -> read + comment
--   - visibility = 'public' AND an active share_links row -> anonymous read (web viewer)
-- IDs are never treated as secrets; every table below is locked down by policy.

alter table public.profiles enable row level security;
alter table public.folders enable row level security;
alter table public.stories enable row level security;
alter table public.story_slides enable row level security;
alter table public.media enable row level security;
alter table public.tags enable row level security;
alter table public.story_tags enable row level security;
alter table public.comments enable row level security;
alter table public.story_members enable row level security;
alter table public.share_links enable row level security;
alter table public.story_versions enable row level security;
alter table public.activity_log enable row level security;

-- ---------------------------------------------------------------------------
-- helper functions (SECURITY DEFINER to sidestep recursive RLS lookups)
-- ---------------------------------------------------------------------------
create function public.is_story_member(p_story_id uuid, p_min_role text default 'viewer')
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.stories s
    left join public.story_members m
      on m.story_id = s.id and m.user_id = auth.uid()
    where s.id = p_story_id
      and (
        s.owner_id = auth.uid()
        or (
          m.user_id is not null
          and (
            p_min_role = 'viewer'
            or (p_min_role = 'editor' and m.role in ('editor', 'owner'))
          )
        )
      )
  );
$$;

create function public.is_story_public(p_story_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.stories s
    join public.share_links sl on sl.story_id = s.id and sl.is_active = true
    where s.id = p_story_id and s.visibility = 'public'
  );
$$;

-- ---------------------------------------------------------------------------
-- profiles: readable by any authenticated user (needed for author names/avatars
-- on shared stories/comments); a user may only edit their own row.
-- ---------------------------------------------------------------------------
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "users manage their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- folders: owner-only in V1 (folders are not shared, only the stories in them)
-- ---------------------------------------------------------------------------
create policy "owners manage their folders"
  on public.folders for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- stories
-- ---------------------------------------------------------------------------
create policy "members read their stories"
  on public.stories for select
  to authenticated
  using (public.is_story_member(id, 'viewer'));

create policy "anonymous read public shared stories"
  on public.stories for select
  to anon
  using (public.is_story_public(id));

create policy "owners insert stories"
  on public.stories for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "owners and editors update stories"
  on public.stories for update
  to authenticated
  using (public.is_story_member(id, 'editor'))
  with check (public.is_story_member(id, 'editor'));

create policy "owners delete stories"
  on public.stories for delete
  to authenticated
  using (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- story_slides (inherit access from parent story)
-- ---------------------------------------------------------------------------
create policy "members read slides"
  on public.story_slides for select
  to authenticated
  using (public.is_story_member(story_id, 'viewer'));

create policy "anonymous read public slides"
  on public.story_slides for select
  to anon
  using (public.is_story_public(story_id));

create policy "editors write slides"
  on public.story_slides for all
  to authenticated
  using (public.is_story_member(story_id, 'editor'))
  with check (public.is_story_member(story_id, 'editor'));

-- ---------------------------------------------------------------------------
-- media
-- ---------------------------------------------------------------------------
create policy "members read media"
  on public.media for select
  to authenticated
  using (public.is_story_member(story_id, 'viewer'));

create policy "anonymous read public media"
  on public.media for select
  to anon
  using (public.is_story_public(story_id));

create policy "editors write media"
  on public.media for all
  to authenticated
  using (public.is_story_member(story_id, 'editor'))
  with check (public.is_story_member(story_id, 'editor'));

-- ---------------------------------------------------------------------------
-- tags (owner-scoped vocabulary)
-- ---------------------------------------------------------------------------
create policy "owners manage their tags"
  on public.tags for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- story_tags
-- ---------------------------------------------------------------------------
create policy "members read story tags"
  on public.story_tags for select
  to authenticated
  using (public.is_story_member(story_id, 'viewer'));

create policy "anonymous read public story tags"
  on public.story_tags for select
  to anon
  using (public.is_story_public(story_id));

create policy "editors manage story tags"
  on public.story_tags for all
  to authenticated
  using (public.is_story_member(story_id, 'editor'))
  with check (public.is_story_member(story_id, 'editor'));

-- ---------------------------------------------------------------------------
-- comments (viewers and editors can comment; authors edit/delete their own)
-- ---------------------------------------------------------------------------
create policy "members read comments"
  on public.comments for select
  to authenticated
  using (public.is_story_member(story_id, 'viewer'));

create policy "members write comments"
  on public.comments for insert
  to authenticated
  with check (public.is_story_member(story_id, 'viewer') and author_id = auth.uid());

create policy "authors manage their comments"
  on public.comments for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "authors or owners delete comments"
  on public.comments for delete
  to authenticated
  using (author_id = auth.uid() or public.is_story_member(story_id, 'editor'));

-- ---------------------------------------------------------------------------
-- story_members (owners manage the roster; members can see who else has access)
-- ---------------------------------------------------------------------------
create policy "members read the roster"
  on public.story_members for select
  to authenticated
  using (public.is_story_member(story_id, 'viewer'));

create policy "owners manage the roster"
  on public.story_members for all
  to authenticated
  using (
    exists (select 1 from public.stories s where s.id = story_id and s.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.stories s where s.id = story_id and s.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- share_links
-- ---------------------------------------------------------------------------
create policy "members read share links"
  on public.share_links for select
  to authenticated
  using (public.is_story_member(story_id, 'viewer'));

create policy "anonymous resolve active share links"
  on public.share_links for select
  to anon
  using (is_active = true);

create policy "owners manage share links"
  on public.share_links for all
  to authenticated
  using (
    exists (select 1 from public.stories s where s.id = story_id and s.owner_id = auth.uid())
  )
  with check (
    exists (select 1 from public.stories s where s.id = story_id and s.owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- story_versions
-- ---------------------------------------------------------------------------
create policy "members read story versions"
  on public.story_versions for select
  to authenticated
  using (public.is_story_member(story_id, 'viewer'));

create policy "editors write story versions"
  on public.story_versions for insert
  to authenticated
  with check (public.is_story_member(story_id, 'editor'));

-- ---------------------------------------------------------------------------
-- activity_log
-- ---------------------------------------------------------------------------
create policy "members read activity log"
  on public.activity_log for select
  to authenticated
  using (story_id is null or public.is_story_member(story_id, 'viewer'));

create policy "members write activity log"
  on public.activity_log for insert
  to authenticated
  with check (actor_id = auth.uid());
