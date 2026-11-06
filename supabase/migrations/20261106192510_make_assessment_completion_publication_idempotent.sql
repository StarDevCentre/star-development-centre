-- Applied to STAR production as Supabase migration 20261106192510.
-- Idempotent completion: reuses the existing family session instead of a duplicate INSERT.
-- Genuine overlapping bookings stay guarded by star_private.booking_guard_family().

CREATE OR REPLACE FUNCTION star_private.publish_assessment_to_family(p_intake_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  intake public.player_intakes;
  calendar_session public.training_sessions;
  linked_session_id uuid;
  existing_publication_id uuid;
  publisher uuid;
begin
  -- Use the same transaction lock as booking writes, so lookup + insert is serialised.
  perform pg_catalog.pg_advisory_xact_lock(781493201);
  select * into intake from public.player_intakes where id=p_intake_id;
  if not found then return; end if;

  select l.session_id into linked_session_id
  from star_private.assessment_calendar_links l where l.intake_id=intake.id;
  if linked_session_id is null then return; end if;

  if intake.assessment_status not in ('confirmed','completed')
    or intake.portal_player_id is null
    or intake.guardian_reviewed_at is null
    or intake.completed_at is null then
    delete from public.family_session_schedule
    where source_session_id=linked_session_id;
    return;
  end if;

  select * into calendar_session from public.training_sessions
  where id=linked_session_id;
  if not found or calendar_session.cancelled_at is not null then
    delete from public.family_session_schedule
    where source_session_id=linked_session_id;
    return;
  end if;

  delete from public.family_session_schedule
  where source_session_id=linked_session_id
    and player_id is distinct from intake.portal_player_id;

  publisher:=calendar_session.created_by;
  if not exists (select 1 from public.staff_members
                 where user_id=publisher and role in ('owner','manager')) then
    raise exception 'Assessment publication requires a STAR manager.';
  end if;

  -- An INSERT ... ON CONFLICT still runs BEFORE INSERT triggers, and the
  -- overlapping-session guard can therefore reject the existing appointment.
  -- Update its existing published row directly, or INSERT only if genuinely new.
  select f.id into existing_publication_id
  from public.family_session_schedule f
  where f.source_session_id=linked_session_id
    and f.player_id=intake.portal_player_id
  for update;

  if existing_publication_id is not null then
    update public.family_session_schedule
    set title=calendar_session.title,
        starts_at=calendar_session.starts_at,
        ends_at=calendar_session.ends_at,
        venue=calendar_session.venue
    where id=existing_publication_id
      and (title,starts_at,ends_at,venue) is distinct from
          (calendar_session.title,calendar_session.starts_at,
           calendar_session.ends_at,calendar_session.venue);
  else
    insert into public.family_session_schedule
      (player_id,title,starts_at,ends_at,venue,published_by,source_session_id)
    values
      (intake.portal_player_id,calendar_session.title,
       calendar_session.starts_at,calendar_session.ends_at,
       calendar_session.venue,publisher,linked_session_id);
  end if;
end;
$function$


revoke all on function star_private.publish_assessment_to_family(uuid) from public, anon, authenticated;
