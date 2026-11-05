-- Keep confirmed assessments visible to the linked parent and the player on the shared sessions schedule.
-- Already applied to STAR production on 5 Nov 2026; this file preserves migration history in source control.

-- A staff-confirmed free assessment is one shared session: staff calendar,
-- parent Sessions, and Player Space. This preserves the approved family/player RLS.
-- Direct-booked assessments already publish through the booking system; do not duplicate them.
create or replace function star_private.publish_assessment_to_family(p_intake_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare
  intake public.player_intakes;
  calendar_session public.training_sessions;
  linked_session_id uuid;
  publisher uuid;
begin
  select * into intake from public.player_intakes where id=p_intake_id;
  if not found then return; end if;

  -- Only appointments created by STAR's assessment calendar sync belong to this workflow.
  select l.session_id into linked_session_id
  from star_private.assessment_calendar_links l where l.intake_id=intake.id;
  if linked_session_id is null then return; end if;

  -- A cancelled or withdrawn assessment must disappear from family/player schedules.
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

  -- If the approved player link changes, prevent a previous family retaining a session.
  delete from public.family_session_schedule
  where source_session_id=linked_session_id
    and player_id is distinct from intake.portal_player_id;

  publisher:=calendar_session.created_by;
  if not exists (select 1 from public.staff_members
                 where user_id=publisher and role in ('owner','manager')) then
    raise exception 'Assessment publication requires a STAR manager.';
  end if;

  -- The existing BEFORE trigger copies time/title/venue from the staff calendar
  -- and connects the player to the staff session roster.
  insert into public.family_session_schedule
   (player_id,title,starts_at,ends_at,venue,published_by,source_session_id)
  values
   (intake.portal_player_id,calendar_session.title,
    calendar_session.starts_at,calendar_session.ends_at,
    calendar_session.venue,publisher,linked_session_id)
  on conflict (source_session_id,player_id)
  do update set
   title=excluded.title,
   starts_at=excluded.starts_at,
   ends_at=excluded.ends_at,
   venue=excluded.venue
  where (public.family_session_schedule.title,
         public.family_session_schedule.starts_at,
         public.family_session_schedule.ends_at,
         public.family_session_schedule.venue)
    is distinct from
        (excluded.title,excluded.starts_at,excluded.ends_at,excluded.venue);
end;
$$;

create or replace function star_private.assessment_family_calendar_trigger()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  perform star_private.publish_assessment_to_family(new.id);
  return new;
end;
$$;

-- The existing sync_confirmed_assessment_calendar trigger runs first (alphabetically)
-- to create/update the authoritative staff training session.
drop trigger if exists zzz_sync_assessment_family_calendar on public.player_intakes;
create trigger zzz_sync_assessment_family_calendar
after insert or update of
  assessment_status,assessment_starts_at,assessment_venue,portal_player_id,
  guardian_reviewed_at,completed_at
on public.player_intakes
for each row execute function star_private.assessment_family_calendar_trigger();

revoke all on function star_private.publish_assessment_to_family(uuid)
 from public,anon,authenticated;
revoke all on function star_private.assessment_family_calendar_trigger()
 from public,anon,authenticated;

-- Backfill already-confirmed appointments, including tomorrow's assessment.
do $$
declare record_id uuid;
begin
  for record_id in
    select i.id from public.player_intakes i
    join star_private.assessment_calendar_links l on l.intake_id=i.id
  loop
    perform star_private.publish_assessment_to_family(record_id);
  end loop;
end;
$$;

