-- Local-only: Supabase grants broad table-level privileges to `anon` and
-- `authenticated` by default (RLS then restricts rows); replicate that here
-- so the local test cluster behaves the same way. NOT part of the real
-- migration set.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant usage on all sequences in schema public to authenticated;
