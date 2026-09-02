-- Supabase Storage bucket for media (images/videos/files), plus RLS on
-- storage.objects.
--
-- Objects are uploaded to `stories/<story_id>/<uuid>.<ext>` *before* the
-- corresponding public.media row exists (the app uploads the file, then
-- inserts metadata using the path it got back) — so these policies check
-- access by parsing story_id out of the object path itself via
-- storage.foldername(), rather than joining to public.media, which would
-- always be empty at upload time.

insert into storage.buckets (id, name, public)
values ('media', 'media', false)
on conflict (id) do nothing;

create policy "media storage select" on storage.objects
  for select to authenticated, anon
  using (
    bucket_id = 'media'
    and exists (
      select 1 from public.stories s
      where s.id = ((storage.foldername(name))[2])::uuid
        and (
          s.created_by = auth.uid()
          or public.story_role(s.id, auth.uid()) is not null
          or public.story_is_shared_public(s.id)
        )
    )
  );

create policy "media storage insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and exists (
      select 1 from public.stories s
      where s.id = ((storage.foldername(name))[2])::uuid
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) in ('owner', 'editor'))
    )
  );

create policy "media storage update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media'
    and exists (
      select 1 from public.stories s
      where s.id = ((storage.foldername(name))[2])::uuid
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) in ('owner', 'editor'))
    )
  )
  with check (
    bucket_id = 'media'
    and exists (
      select 1 from public.stories s
      where s.id = ((storage.foldername(name))[2])::uuid
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) in ('owner', 'editor'))
    )
  );

create policy "media storage delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and exists (
      select 1 from public.stories s
      where s.id = ((storage.foldername(name))[2])::uuid
        and (s.created_by = auth.uid() or public.story_role(s.id, auth.uid()) in ('owner', 'editor'))
    )
  );
