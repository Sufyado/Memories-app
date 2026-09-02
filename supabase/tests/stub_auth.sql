-- Local-only stub of the bits of Supabase's `auth` schema our migrations
-- depend on, so they can be validated against a plain local Postgres.
-- NOT part of the real migration set — never apply this to Supabase.

create schema if not exists auth;

create table auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb
);

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon;
  end if;
end
$$;

grant usage on schema public to authenticated, anon;
grant usage on schema auth to authenticated, anon;
