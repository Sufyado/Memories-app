-- Vistoria core schema.
-- Applies on top of Supabase's built-in `auth` schema.
-- Run this file, then 20260902010100_rls.sql, in the Supabase SQL editor
-- (or `supabase db push` if you use the Supabase CLI).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles (one row per auth.users row; holds app-specific profile fields)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- folders (self-nesting collections; owner-only in V1)
-- ---------------------------------------------------------------------------
create table public.folders (
  id uuid primary key default gen_random_uuid(),
  parent_folder_id uuid references public.folders (id) on delete cascade,
  name text not null,
  cover_media_id uuid,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index folders_parent_idx on public.folders (parent_folder_id);
create index folders_created_by_idx on public.folders (created_by);

-- ---------------------------------------------------------------------------
-- stories (the core Memory / Knowledge Object)
-- ---------------------------------------------------------------------------
create type public.story_visibility as enum ('private', 'team', 'link', 'public');
create type public.story_status as enum ('draft', 'published', 'archived');

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid references public.folders (id) on delete set null,
  title text not null,
  description text,
  cover_media_id uuid,
  created_by uuid not null references public.profiles (id) on delete cascade,
  updated_by uuid not null references public.profiles (id) on delete cascade,
  visibility public.story_visibility not null default 'private',
  status public.story_status not null default 'draft',
  version integer not null default 1,
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A')
    || setweight(to_tsvector('simple', coalesce(description, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index stories_folder_idx on public.stories (folder_id);
create index stories_created_by_idx on public.stories (created_by);
create index stories_status_idx on public.stories (status);
create index stories_visibility_idx on public.stories (visibility);
create index stories_search_idx on public.stories using gin (search_vector);

-- ---------------------------------------------------------------------------
-- story_slides (ordered slides; blocks hold heading/body/checklist/etc.)
-- ---------------------------------------------------------------------------
create or replace function public.slide_blocks_text(blocks jsonb)
returns text
language sql
immutable
as $$
  select coalesce(
    string_agg(coalesce(elem ->> 'text', '') || ' ' || coalesce(elem ->> 'url', ''), ' '),
    ''
  )
  from jsonb_array_elements(coalesce(blocks, '[]'::jsonb)) as elem;
$$;

create table public.story_slides (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  order_index integer not null,
  media_id uuid,
  media_type text check (media_type in ('image', 'video')),
  blocks jsonb not null default '[]'::jsonb,
  event_date date,
  search_vector tsvector generated always as (
    to_tsvector('simple', coalesce(public.slide_blocks_text(blocks), ''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (story_id, order_index)
);

create index story_slides_story_idx on public.story_slides (story_id);
create index story_slides_search_idx on public.story_slides using gin (search_vector);

-- ---------------------------------------------------------------------------
-- media (Supabase Storage metadata only — never the binary itself)
-- ---------------------------------------------------------------------------
create table public.media (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  slide_id uuid references public.story_slides (id) on delete set null,
  type text not null check (type in ('image', 'video', 'file')),
  storage_path text not null,
  mime_type text not null,
  width integer,
  height integer,
  duration_ms integer,
  thumbnail_path text,
  created_at timestamptz not null default now()
);

create index media_story_idx on public.media (story_id);
create index media_slide_idx on public.media (slide_id);

-- Deferred FKs now that `media` exists.
alter table public.folders
  add constraint folders_cover_media_fkey foreign key (cover_media_id) references public.media (id) on delete set null;
alter table public.stories
  add constraint stories_cover_media_fkey foreign key (cover_media_id) references public.media (id) on delete set null;
alter table public.story_slides
  add constraint story_slides_media_fkey foreign key (media_id) references public.media (id) on delete set null;

-- ---------------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table public.story_tags (
  story_id uuid not null references public.stories (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (story_id, tag_id)
);

create index story_tags_tag_idx on public.story_tags (tag_id);

-- ---------------------------------------------------------------------------
-- comments (story-level in V1; slide_id already present for later use)
-- ---------------------------------------------------------------------------
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  slide_id uuid references public.story_slides (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_story_idx on public.comments (story_id);

-- ---------------------------------------------------------------------------
-- story_members (team sharing: owner / editor / viewer)
-- ---------------------------------------------------------------------------
create table public.story_members (
  story_id uuid not null references public.stories (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (story_id, user_id)
);

create index story_members_user_idx on public.story_members (user_id);

-- ---------------------------------------------------------------------------
-- share_links (public/link-access sharing, resolved by slug)
-- ---------------------------------------------------------------------------
create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  slug text not null unique,
  visibility text not null check (visibility in ('link', 'public')),
  is_active boolean not null default true,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index share_links_story_idx on public.share_links (story_id);

-- ---------------------------------------------------------------------------
-- story_versions (snapshot history; app increments stories.version on save)
-- ---------------------------------------------------------------------------
create table public.story_versions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  version integer not null,
  updated_by uuid not null references public.profiles (id),
  updated_at timestamptz not null default now(),
  snapshot jsonb not null,
  unique (story_id, version)
);

-- ---------------------------------------------------------------------------
-- activity_log (lightweight audit trail)
-- ---------------------------------------------------------------------------
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories (id) on delete cascade,
  actor_id uuid not null references public.profiles (id),
  action text not null check (
    action in ('story_created', 'story_updated', 'story_shared', 'slide_added', 'slide_edited', 'slide_deleted')
  ),
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index activity_log_story_idx on public.activity_log (story_id);

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.folders for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.stories for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.story_slides for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.comments for each row execute function public.set_updated_at();
