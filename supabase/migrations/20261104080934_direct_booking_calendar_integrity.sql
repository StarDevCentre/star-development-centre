
create or replace function star_private.booking_guard_calendar() returns trigger language plpgsql security definer set search_path='' as $$
declare coach uuid; b star_private.booking_sessions;
begin
 perform pg_advisory_xact_lock(781493201);
 if tg_op='DELETE' then
  if exists(select 1 from star_private.booking_sessions where session_id=old.id) then raise exception 'Use Booking management to close or cancel a released session and retain its history.'; end if; return old;
 end if;
 select * into b from star_private.booking_sessions where session_id=new.id;
 if tg_op='UPDATE' and b.session_id is not null and (new.starts_at,new.ends_at,new.venue,new.title,new.programme,new.cancelled_at) is distinct from (old.starts_at,old.ends_at,old.venue,old.title,old.programme,old.cancelled_at) then
  if not (not b.enabled and new.cancelled_at is not null and old.cancelled_at is null and (new.starts_at,new.ends_at,new.venue,new.title,new.programme) is not distinct from (old.starts_at,old.ends_at,old.venue,old.title,old.programme)) then raise exception 'Released booking arrangements are fixed. Cancel through Booking management and release a replacement.'; end if;
 end if;
 if new.cancelled_at is null then
  select coalesce(b.coach_id,(select coach_id from star_private.org_session_details where session_id=new.id)) into coach;
  if coach is null then
   if exists(select 1 from public.training_sessions s where s.id<>new.id and s.cancelled_at is null and s.starts_at<new.ends_at+interval '30 minutes' and s.ends_at+interval '30 minutes'>new.starts_at) then raise exception 'An unassigned calendar session must leave every coach free, including the 30-minute travel/setup gap. Assign a coach through Booking management or Schools & clubs.'; end if;
  elsif not star_private.booking_free(coach,new.starts_at,new.ends_at,new.id) then raise exception 'This coach is already booked, including the 30-minute travel/setup gap.'; end if;
 end if;
 return new;
end $$;
create or replace function star_private.booking_guard_family() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(781493201);
 if tg_op='DELETE' then
  if exists(select 1 from star_private.booking_places p where p.session_id=old.source_session_id and p.player_id=old.player_id and p.cancelled_at is null) then raise exception 'Cancel direct bookings through Booking management to retain their record.'; end if;return old;
 end if;
 if tg_op='UPDATE' and exists(select 1 from star_private.booking_places p where p.session_id=old.source_session_id and p.player_id=old.player_id and p.cancelled_at is null) and (new.source_session_id,new.player_id,new.starts_at,new.ends_at,new.venue) is distinct from (old.source_session_id,old.player_id,old.starts_at,old.ends_at,old.venue) then raise exception 'Change direct bookings through Booking management.'; end if;
 if exists(select 1 from star_private.booking_sessions where session_id=new.source_session_id) and not exists(select 1 from star_private.booking_places p where p.session_id=new.source_session_id and p.player_id=new.player_id and p.cancelled_at is null) then raise exception 'Book a released place through the booking calendar.'; end if;
 if tg_op='INSERT' or (new.starts_at,new.ends_at,new.player_id) is distinct from (old.starts_at,old.ends_at,old.player_id) then
  if exists(select 1 from public.family_session_schedule f where f.player_id=new.player_id and f.id<>new.id and f.starts_at<new.ends_at and f.ends_at>new.starts_at) then raise exception 'The player already has a session at that time.'; end if;
 end if;
 return new;
end $$;
