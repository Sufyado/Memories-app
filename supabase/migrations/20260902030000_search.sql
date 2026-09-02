-- Full-text search across story title/description, slide text, tag
-- names, and folder names (spec section 13). Runs as SECURITY INVOKER
-- (the default) so Row Level Security still applies per row for
-- whichever user/role calls it — this is not a security-definer bypass.

create or replace function public.search_stories(search_query text)
returns setof public.stories
language sql
stable
as $$
  select distinct s.*
  from public.stories s
  left join public.story_tags st on st.story_id = s.id
  left join public.tags t on t.id = st.tag_id
  left join public.story_slides sl on sl.story_id = s.id
  left join public.folders f on f.id = s.folder_id
  where
    search_query is not null
    and length(trim(search_query)) > 0
    and (
      s.search_vector @@ websearch_to_tsquery('simple', search_query)
      or sl.search_vector @@ websearch_to_tsquery('simple', search_query)
      or t.name ilike '%' || search_query || '%'
      or f.name ilike '%' || search_query || '%'
    )
  order by s.updated_at desc
  limit 50;
$$;

grant execute on function public.search_stories(text) to authenticated, anon;
