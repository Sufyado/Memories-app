-- Bulk slide reorder in one round trip (drag-to-reorder in the editor).
-- SECURITY INVOKER (default): the UPDATE still goes through the normal
-- "editors write slides" RLS policy, so this grants no extra privilege.
create function public.reorder_slides(p_story_id uuid, p_ordered_ids uuid[])
returns void
language plpgsql
as $$
begin
  update public.story_slides ss
  set position = x.ord - 1
  from unnest(p_ordered_ids) with ordinality as x(id, ord)
  where ss.id = x.id and ss.story_id = p_story_id;
end;
$$;
