-- Search, versioning and activity-log support functions.

-- ---------------------------------------------------------------------------
-- Unified full text search across stories, slides, tags, folders and comments.
-- SECURITY INVOKER (the default) so every underlying select still goes through
-- RLS — a caller only ever sees matches inside stories they can access.
-- Kept as a single RPC boundary so a future semantic/AI search implementation
-- can replace the body without changing how the app calls it.
-- ---------------------------------------------------------------------------
create function public.search_stories(p_query text)
returns table (story_id uuid, rank real)
language sql
stable
as $$
  with q as (
    select websearch_to_tsquery('simple', p_query) as tsq
  ),
  story_matches as (
    select s.id as story_id, ts_rank(s.search_vector, q.tsq) as rank
    from public.stories s, q
    where s.search_vector @@ q.tsq
  ),
  slide_matches as (
    select sl.story_id, ts_rank(sl.search_vector, q.tsq) as rank
    from public.story_slides sl, q
    where sl.search_vector @@ q.tsq
  ),
  tag_matches as (
    select st.story_id, 0.5::real as rank
    from public.story_tags st
    join public.tags t on t.id = st.tag_id
    where t.name ilike '%' || p_query || '%'
  ),
  folder_matches as (
    select s.id as story_id, 0.3::real as rank
    from public.stories s
    join public.folders f on f.id = s.folder_id
    where f.name ilike '%' || p_query || '%'
  ),
  comment_matches as (
    select c.story_id, ts_rank(to_tsvector('simple', c.text), q.tsq) as rank
    from public.comments c, q
    where to_tsvector('simple', c.text) @@ q.tsq
  ),
  combined as (
    select * from story_matches
    union all select * from slide_matches
    union all select * from tag_matches
    union all select * from folder_matches
    union all select * from comment_matches
  )
  select story_id, max(rank) as rank
  from combined
  group by story_id
  order by rank desc;
$$;

-- ---------------------------------------------------------------------------
-- Save a new story version: bumps stories.version and inserts a snapshot row.
-- Runs as the caller (invoker), so the RLS "editors update stories" policy
-- still gates who may call this.
-- ---------------------------------------------------------------------------
create function public.bump_story_version(p_story_id uuid, p_snapshot jsonb)
returns integer
language plpgsql
as $$
declare
  v_new_version integer;
begin
  update public.stories
  set version = version + 1, updated_by = auth.uid()
  where id = p_story_id
  returning version into v_new_version;

  if v_new_version is null then
    raise exception 'story % not found or not editable', p_story_id;
  end if;

  insert into public.story_versions (story_id, version, snapshot, updated_by)
  values (p_story_id, v_new_version, p_snapshot, auth.uid());

  return v_new_version;
end;
$$;

-- ---------------------------------------------------------------------------
-- Activity log triggers (best-effort; V1 has no dedicated UI for this table).
-- ---------------------------------------------------------------------------
create function public.log_story_created()
returns trigger
language plpgsql
as $$
begin
  insert into public.activity_log (story_id, folder_id, actor_id, action, metadata)
  values (new.id, new.folder_id, auth.uid(), 'story_created', jsonb_build_object('title', new.title));
  return new;
end;
$$;

create trigger stories_log_created
  after insert on public.stories
  for each row execute procedure public.log_story_created();

create function public.log_story_updated()
returns trigger
language plpgsql
as $$
begin
  if new.version <> old.version then
    insert into public.activity_log (story_id, folder_id, actor_id, action, metadata)
    values (new.id, new.folder_id, auth.uid(), 'story_updated', jsonb_build_object('version', new.version));
  end if;
  return new;
end;
$$;

create trigger stories_log_updated
  after update on public.stories
  for each row execute procedure public.log_story_updated();

create function public.log_slide_added()
returns trigger
language plpgsql
as $$
begin
  insert into public.activity_log (story_id, actor_id, action, metadata)
  values (new.story_id, auth.uid(), 'slide_added', jsonb_build_object('slide_id', new.id));
  return new;
end;
$$;

create trigger story_slides_log_added
  after insert on public.story_slides
  for each row execute procedure public.log_slide_added();

create function public.log_share_link_created()
returns trigger
language plpgsql
as $$
begin
  insert into public.activity_log (story_id, actor_id, action, metadata)
  values (new.story_id, auth.uid(), 'story_shared', jsonb_build_object('slug', new.slug));
  return new;
end;
$$;

create trigger share_links_log_created
  after insert on public.share_links
  for each row execute procedure public.log_share_link_created();

-- ---------------------------------------------------------------------------
-- Owner auto-membership: creating a story also inserts an 'owner' story_members
-- row, so is_story_member() and the roster UI have a single source of truth.
-- ---------------------------------------------------------------------------
create function public.add_owner_as_story_member()
returns trigger
language plpgsql
as $$
begin
  insert into public.story_members (story_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (story_id, user_id) do nothing;
  return new;
end;
$$;

create trigger stories_add_owner_member
  after insert on public.stories
  for each row execute procedure public.add_owner_as_story_member();
