-- Local-only stub of the bits of Supabase's `storage` schema our
-- migrations depend on, so they can be validated against a plain local
-- Postgres. NOT part of the real migration set — never apply this to
-- Supabase (it already has a real `storage` schema).

create schema if not exists storage;

create table storage.buckets (
  id text primary key,
  name text not null,
  owner uuid,
  public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text,
  owner uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  metadata jsonb
);

alter table storage.objects enable row level security;

-- Matches the real Supabase storage.foldername(): every path segment
-- except the object's own filename.
create or replace function storage.foldername(name text)
returns text[]
language plpgsql
immutable
as $$
declare
  _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[1 : array_length(_parts, 1) - 1];
end
$$;

grant usage on schema storage to authenticated, anon;
