-- Vistoria V1 schema
-- Core model: Archive (implicit) -> Folder -> Story -> Slides (ordered content blocks).
-- Slides store a flexible `blocks` jsonb array (heading/body/caption/media/checklist/
-- warning/quote/link/file) so a slide is never limited to one element, while denormalized
-- heading/body/caption columns stay in sync for fast full-text search.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles (mirrors auth.users; public data safe to join against from RLS'd tables)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- folders (self-referencing parent_folder_id supports nesting; V1 UI is flat)
-- ---------------------------------------------------------------------------
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  parent_folder_id uuid references public.folders (id) on delete cascade,
  name text not null,
  cover_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index folders_owner_id_idx on public.folders (owner_id);
create index folders_parent_folder_id_idx on public.folders (parent_folder_id);

-- ---------------------------------------------------------------------------
-- stories
-- ---------------------------------------------------------------------------
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.folders (id) on delete set null,
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  cover_storage_path text,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  visibility text not null default 'private' check (visibility in ('private', 'team', 'public')),
  version integer not null default 1,
  slug text unique,
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) stored
);

create index stories_folder_id_idx on public.stories (folder_id);
create index stories_owner_id_idx on public.stories (owner_id);
create index stories_visibility_idx on public.stories (visibility);
create index stories_search_vector_idx on public.stories using gin (search_vector);
create unique index stories_slug_idx on public.stories (slug) where slug is not null;

-- ---------------------------------------------------------------------------
-- story_slides
-- ---------------------------------------------------------------------------
create table public.story_slides (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  position integer not null default 0,
  heading text,
  body text,
  caption text,
  blocks jsonb not null default '[]'::jsonb,
  event_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(heading, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(body, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(caption, '')), 'C')
  ) stored
);

create index story_slides_story_id_idx on public.story_slides (story_id, position);
create index story_slides_search_vector_idx on public.story_slides using gin (search_vector);

-- ---------------------------------------------------------------------------
-- media (Supabase Storage holds the bytes; this table is metadata only)
-- ---------------------------------------------------------------------------
create table public.media (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  slide_id uuid references public.story_slides (id) on delete cascade,
  type text not null check (type in ('image', 'video', 'file')),
  storage_path text not null,
  thumbnail_path text,
  mime_type text,
  width integer,
  height integer,
  duration_ms integer,
  size_bytes bigint,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index media_story_id_idx on public.media (story_id);
create index media_slide_id_idx on public.media (slide_id);

-- ---------------------------------------------------------------------------
-- tags (per-owner vocabulary; story_tags links them to stories)
-- ---------------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table public.story_tags (
  story_id uuid not null references public.stories (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (story_id, tag_id)
);

create index story_tags_tag_id_idx on public.story_tags (tag_id);

-- ---------------------------------------------------------------------------
-- comments (story-level in V1; slide_id / video_timestamp_ms reserved for later)
-- ---------------------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  slide_id uuid references public.story_slides (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  video_timestamp_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_story_id_idx on public.comments (story_id, created_at);

-- ---------------------------------------------------------------------------
-- story_members (per-story roles: owner / editor / viewer)
-- ---------------------------------------------------------------------------
create table public.story_members (
  story_id uuid not null references public.stories (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  invited_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  primary key (story_id, user_id)
);

create index story_members_user_id_idx on public.story_members (user_id);

-- ---------------------------------------------------------------------------
-- share_links (public web viewer access; disable/enable without losing the slug)
-- ---------------------------------------------------------------------------
create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  slug text not null unique,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  disabled_at timestamptz
);

create index share_links_story_id_idx on public.share_links (story_id);

-- ---------------------------------------------------------------------------
-- story_versions (snapshot history; V1 writes a row on every meaningful save)
-- ---------------------------------------------------------------------------
create table public.story_versions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  updated_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index story_versions_story_id_idx on public.story_versions (story_id, version desc);

-- ---------------------------------------------------------------------------
-- activity_log (lightweight event trail; no dedicated UI required in V1)
-- ---------------------------------------------------------------------------
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.stories (id) on delete cascade,
  folder_id uuid references public.folders (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index activity_log_story_id_idx on public.activity_log (story_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger folders_set_updated_at before update on public.folders
  for each row execute procedure public.set_updated_at();
create trigger stories_set_updated_at before update on public.stories
  for each row execute procedure public.set_updated_at();
create trigger story_slides_set_updated_at before update on public.story_slides
  for each row execute procedure public.set_updated_at();
create trigger comments_set_updated_at before update on public.comments
  for each row execute procedure public.set_updated_at();
