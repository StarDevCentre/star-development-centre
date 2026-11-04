-- Read-only: lets active STAR staff see who booked a direct-booking session and which player it is for.
-- Managers/owners see all booked sessions; other coaches only see sessions assigned to them.
-- Returns names and the booking focus only (no email, phone, date of birth or health information).
create or replace function star_private.staff_booking_people(p_session_ids uuid[])
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  manager boolean;
begin
  if uid is null or not star_private.is_active_staff() then
    raise exception 'STAR staff access required.';
  end if;
  if coalesce(array_length(p_session_ids, 1), 0) > 300 then
    raise exception 'Too many sessions requested.';
  end if;
  manager := star_private.is_staff_manager();
  return coalesce((
    select jsonb_object_agg(x.session_id, x.people)
    from (
      select bp.session_id,
        jsonb_agg(jsonb_build_object(
          'player_name', nullif(trim(coalesce(pl.first_name, '') || ' ' || coalesce(pl.last_name, '')), ''),
          'booked_by', gp.display_name,
          'organisation', o.name,
          'service', sv.title,
          'details', nullif(bo.details, '')
        ) order by bp.id) as people
      from star_private.booking_places bp
      join star_private.booking_sessions bs on bs.session_id = bp.session_id
      join star_private.booking_orders bo on bo.id = bp.order_id
      join star_private.booking_services sv on sv.id = bo.service_id
      left join public.coaching_players pl on pl.id = coalesce(bp.player_id, bo.player_id)
      left join public.guardian_profiles gp on gp.user_id = bo.created_by
      left join public.star_organisations o on o.id = bo.organisation_id
      where bp.session_id = any(p_session_ids)
        and bp.cancelled_at is null
        and (manager or bs.coach_id = uid)
      group by bp.session_id
    ) x
  ), '{}'::jsonb);
end;
$$;

create or replace function public.star_staff_booking_people(p_session_ids uuid[])
returns jsonb
language sql
set search_path = ''
as $$ select star_private.staff_booking_people(p_session_ids) $$;

revoke all on function star_private.staff_booking_people(uuid[]) from public, anon;
revoke all on function public.star_staff_booking_people(uuid[]) from public, anon;
grant execute on function star_private.staff_booking_people(uuid[]) to authenticated;
grant execute on function public.star_staff_booking_people(uuid[]) to authenticated;
