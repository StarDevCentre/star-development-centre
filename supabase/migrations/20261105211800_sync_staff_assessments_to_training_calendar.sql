
-- Keep staff-confirmed free assessments on the shared training calendar.
-- No child names, health data, or safeguarding details are copied to training_sessions.
create table if not exists star_private.assessment_calendar_links (
  intake_id uuid primary key references public.player_intakes(id) on delete cascade,
  session_id uuid not null unique references public.training_sessions(id) on delete restrict
);
alter table star_private.assessment_calendar_links enable row level security;
revoke all on table star_private.assessment_calendar_links from public, anon, authenticated;

create or replace function star_private.guard_linked_assessment_session()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists (
   select 1 from star_private.assessment_calendar_links l
   where l.session_id = old.id
 ) and current_setting('star.assessment_calendar_sync', true) is distinct from 'on' then
   if tg_op='DELETE' or
      (new.starts_at,new.ends_at,new.venue,new.title,new.programme,new.cancelled_at,new.created_by)
        is distinct from
      (old.starts_at,old.ends_at,old.venue,old.title,old.programme,old.cancelled_at,old.created_by)
   then
     raise exception 'Manage the assessment time and venue from Onboarding & free assessments, not the training calendar.';
   end if;
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end;
$$;
drop trigger if exists zz_guard_linked_assessment_session on public.training_sessions;
create trigger zz_guard_linked_assessment_session
 before update or delete on public.training_sessions
 for each row execute function star_private.guard_linked_assessment_session();

create or replace function star_private.sync_assessment_into_calendar(p_intake_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare
  r public.player_intakes;
  existing_session uuid;
  direct_session uuid;
  actor uuid;
  venue_text text;
begin
  perform pg_catalog.pg_advisory_xact_lock(781493201);
  select * into r from public.player_intakes where id=p_intake_id for update;
  if not found then return; end if;
  select l.session_id into existing_session from star_private.assessment_calendar_links l where l.intake_id=r.id;

  if r.assessment_status='confirmed' then
    if r.assessment_starts_at is null or coalesce(btrim(r.assessment_venue),'')='' then
      raise exception 'A confirmed assessment needs a start time and venue.';
    end if;
    venue_text:=btrim(r.assessment_venue);
    if char_length(venue_text)>150 then
      raise exception 'Keep the assessment venue within 150 characters for the training calendar.';
    end if;

    -- The direct-booking system already creates its own training calendar session.
    -- Never duplicate its event or modify its controlled booking records.
    if r.portal_player_id is not null then
      select bp.session_id into direct_session
      from star_private.booking_places bp
      join star_private.booking_orders bo on bo.id=bp.order_id
      join public.training_sessions ts on ts.id=bp.session_id
      where bp.player_id=r.portal_player_id and bo.service_id='assessment'
        and bp.cancelled_at is null and ts.cancelled_at is null
        and ts.starts_at=r.assessment_starts_at
      order by bo.created_at desc limit 1;
    end if;
    if direct_session is not null then
      if existing_session is not null and existing_session<>direct_session then
        raise exception 'This assessment already has a separate training-calendar entry. Contact STAR to reconcile the booking.';
      end if;
      return;
    end if;

    if existing_session is null then
      if auth.uid() is not null and not star_private.is_staff_manager() then
        raise exception 'Only authorised STAR managers can add an assessment to the staff calendar.';
      end if;
      actor:=auth.uid();
      if actor is null then
        select user_id into actor from public.staff_members where active and role in ('owner','manager')
         order by case role when 'owner' then 0 else 1 end limit 1;
      end if;
      if actor is null then raise exception 'No active STAR manager can own the calendar entry.'; end if;
      insert into public.training_sessions(title,programme,starts_at,ends_at,venue,created_by)
      values ('FREE assessment','Other',r.assessment_starts_at,
        r.assessment_starts_at+interval '30 minutes',venue_text,actor)
      returning id into existing_session;
      insert into star_private.assessment_calendar_links(intake_id,session_id)
      values(r.id,existing_session);
    else
      perform pg_catalog.set_config('star.assessment_calendar_sync','on',true);
      update public.training_sessions
       set title='FREE assessment',programme='Other',
           starts_at=r.assessment_starts_at,ends_at=r.assessment_starts_at+interval '30 minutes',
           venue=venue_text,cancelled_at=null
       where id=existing_session
         and (title,programme,starts_at,ends_at,venue,cancelled_at)
            is distinct from
             ('FREE assessment','Other',r.assessment_starts_at,
              r.assessment_starts_at+interval '30 minutes',venue_text,null::timestamptz);
      perform pg_catalog.set_config('star.assessment_calendar_sync','off',true);
    end if;

  elsif r.assessment_status in ('requested','cancelled','not_requested') and existing_session is not null then
    perform pg_catalog.set_config('star.assessment_calendar_sync','on',true);
    update public.training_sessions set cancelled_at=now()
      where id=existing_session and cancelled_at is null;
    perform pg_catalog.set_config('star.assessment_calendar_sync','off',true);
  end if;
end;
$$;

create or replace function star_private.sync_assessment_calendar_trigger()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform star_private.sync_assessment_into_calendar(new.id);
 return new;
end;
$$;
drop trigger if exists sync_confirmed_assessment_calendar on public.player_intakes;
create trigger sync_confirmed_assessment_calendar
 after insert or update of assessment_status,assessment_starts_at,assessment_venue on public.player_intakes
 for each row execute function star_private.sync_assessment_calendar_trigger();

revoke all on function star_private.guard_linked_assessment_session() from public,anon,authenticated;
revoke all on function star_private.sync_assessment_into_calendar(uuid) from public,anon,authenticated;
revoke all on function star_private.sync_assessment_calendar_trigger() from public,anon,authenticated;

-- Backfill previously confirmed assessments, including already arranged introductions.
do $$
declare row_id uuid;
begin
 for row_id in select id from public.player_intakes where assessment_status='confirmed' loop
   perform star_private.sync_assessment_into_calendar(row_id);
 end loop;
end;
$$;
