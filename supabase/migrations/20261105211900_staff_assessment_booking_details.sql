
-- Staff-only detail lookup for manually confirmed assessments.
-- The calendar's general session title remains anonymous; only managers get player names.
create or replace function star_private.staff_assessment_booking_people(p_session_ids uuid[])
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not star_private.is_active_staff() then
   raise exception 'STAR staff access required.';
 end if;
 if coalesce(array_length(p_session_ids,1),0)>300 then
   raise exception 'Too many sessions requested.';
 end if;
 if not star_private.is_staff_manager() then
   return '{}'::jsonb;
 end if;
 return coalesce((
   select jsonb_object_agg(l.session_id::text,
      jsonb_build_array(jsonb_build_object(
        'player_name',nullif(btrim(i.first_name||' '||i.last_name),''),
        'booked_by',null,
        'organisation',null,
        'service','FREE 30-minute assessment',
        'details',null
      )))
   from star_private.assessment_calendar_links l
   join public.player_intakes i on i.id=l.intake_id
   where l.session_id = any(p_session_ids)
 ),'{}'::jsonb);
end;
$$;
create or replace function public.star_staff_booking_people(p_session_ids uuid[])
returns jsonb language sql security invoker set search_path='' as $$
select star_private.staff_booking_people(p_session_ids)
       || star_private.staff_assessment_booking_people(p_session_ids)
$$;
revoke all on function star_private.staff_assessment_booking_people(uuid[]) from public,anon,authenticated;
revoke all on function public.star_staff_booking_people(uuid[]) from public,anon;
grant execute on function public.star_staff_booking_people(uuid[]) to authenticated;
