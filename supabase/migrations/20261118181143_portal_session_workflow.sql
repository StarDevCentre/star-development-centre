-- The training session remains the canonical appointment. A family projection and
-- its register are created in the same transaction from an explicitly selected player.
alter table public.training_sessions
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by uuid references auth.users(id) on delete set null;
alter table public.family_session_schedule
  add column if not exists venue_version uuid not null default gen_random_uuid();

create table star_private.booking_moves (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.training_sessions(id) on delete cascade,
  moved_by uuid references auth.users(id) on delete set null,
  previous_start timestamptz not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  transaction_id xid8 not null default pg_current_xact_id(),
  moved_at timestamptz not null default now()
);
create index booking_moves_session on star_private.booking_moves(session_id,transaction_id);
alter table star_private.booking_moves enable row level security;
revoke all on star_private.booking_moves from public,anon,authenticated;

create table star_private.venue_openings (
  family_session_id uuid not null references public.family_session_schedule(id) on delete cascade,
  guardian_id uuid not null references auth.users(id) on delete cascade,
  venue_version uuid not null,
  opened_at timestamptz not null default clock_timestamp(),
  primary key (family_session_id,guardian_id,venue_version)
);
alter table star_private.venue_openings enable row level security;
revoke all on star_private.venue_openings from public,anon,authenticated;

create function star_private.is_confirmed_booking_move(
  p_session uuid,p_start timestamptz,p_end timestamptz
) returns boolean
language sql volatile security definer set search_path='' as $$
  select exists (
    select 1 from star_private.booking_moves
    where session_id=p_session
      and transaction_id=pg_current_xact_id_if_assigned()
      and moved_by=(select auth.uid())
      and starts_at=p_start and ends_at=p_end
  )
$$;
revoke all on function star_private.is_confirmed_booking_move(uuid,timestamptz,timestamptz) from public,anon,authenticated;

-- Keep direct bookings protected from general calendar edits. Only a checked
-- move of the same appointment may update an individual direct booking.
create or replace function star_private.booking_guard_calendar() returns trigger
language plpgsql security definer set search_path='' as $$
declare
  coach uuid;
  booking star_private.booking_sessions;
begin
  perform pg_advisory_xact_lock(781493201);
  if tg_op='DELETE' then
    if exists(select 1 from star_private.booking_sessions where session_id=old.id) then
      raise exception 'Use Booking management to close or cancel a released session and retain its history.';
    end if;
    return old;
  end if;

  select * into booking from star_private.booking_sessions where session_id=new.id;
  if tg_op='UPDATE' and
      (new.starts_at,new.ends_at,new.venue,new.title,new.programme,new.cancelled_at)
      is distinct from (old.starts_at,old.ends_at,old.venue,old.title,old.programme,old.cancelled_at) then
    if old.completed_at is not null then
      raise exception 'Completed sessions keep their recorded arrangements.';
    end if;
    if booking.session_id is not null and not (
      (not booking.enabled and new.cancelled_at is not null and old.cancelled_at is null
       and (new.starts_at,new.ends_at,new.venue,new.title,new.programme)
           is not distinct from (old.starts_at,old.ends_at,old.venue,old.title,old.programme))
      or (booking.service_id='one_to_one'
          and (new.venue,new.title,new.programme,new.cancelled_at)
              is not distinct from (old.venue,old.title,old.programme,old.cancelled_at)
          and star_private.is_confirmed_booking_move(new.id,new.starts_at,new.ends_at))
    ) then
      raise exception 'Use the booking controls to change a released booking.';
    end if;
  end if;

  if new.cancelled_at is null and (
    tg_op='INSERT' or (new.starts_at,new.ends_at,new.cancelled_at)
      is distinct from (old.starts_at,old.ends_at,old.cancelled_at)
  ) then
    select coalesce(booking.coach_id,(select coach_id from star_private.org_session_details where session_id=new.id)) into coach;
    if coach is null and exists (
      select 1 from public.training_sessions s
      where s.id<>new.id and s.cancelled_at is null
        and s.starts_at<new.ends_at+interval '30 minutes'
        and s.ends_at+interval '30 minutes'>new.starts_at
    ) then
      raise exception 'That time clashes with the calendar or the 30-minute travel and setup gap.';
    elsif coach is not null and not star_private.booking_free(coach,new.starts_at,new.ends_at,new.id) then
      raise exception 'This coach is already booked, including the 30-minute travel and setup gap.';
    end if;
  end if;
  return new;
end $$;

create or replace function star_private.booking_guard_family() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(781493201);
  if tg_op='DELETE' then
    if exists(select 1 from star_private.booking_places p where p.session_id=old.source_session_id and p.player_id=old.player_id and p.cancelled_at is null) then
      raise exception 'Cancel direct bookings through Booking management to retain their record.';
    end if;
    return old;
  end if;
  if tg_op='UPDATE'
     and (new.source_session_id,new.player_id,new.starts_at,new.ends_at,new.venue)
         is distinct from (old.source_session_id,old.player_id,old.starts_at,old.ends_at,old.venue)
     and exists(select 1 from star_private.booking_places p where p.session_id=old.source_session_id and p.player_id=old.player_id and p.cancelled_at is null)
     and not (
       (new.source_session_id,new.player_id,new.venue) is not distinct from (old.source_session_id,old.player_id,old.venue)
       and star_private.is_confirmed_booking_move(new.source_session_id,new.starts_at,new.ends_at)
     ) then
    raise exception 'Change direct bookings through the booking controls.';
  end if;
  if exists(select 1 from star_private.booking_sessions where session_id=new.source_session_id)
     and not exists(select 1 from star_private.booking_places p where p.session_id=new.source_session_id and p.player_id=new.player_id and p.cancelled_at is null) then
    raise exception 'Book a released place through the booking calendar.';
  end if;
  if tg_op='INSERT' or (new.starts_at,new.ends_at,new.player_id) is distinct from (old.starts_at,old.ends_at,old.player_id) then
    if exists(select 1 from public.family_session_schedule f where f.player_id=new.player_id and f.id<>new.id
        and f.starts_at<new.ends_at and f.ends_at>new.starts_at) then
      raise exception 'The player already has a session at that time.';
    end if;
  end if;
  if tg_op='UPDATE' then
    new.venue_version:=case when new.venue is distinct from old.venue then gen_random_uuid() else old.venue_version end;
  end if;
  return new;
end $$;

create or replace function star_private.limit_session_focus_edit() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is not null and not star_private.is_staff_manager()
    and (to_jsonb(new)-array['coach_focus','kit_list']) is distinct from (to_jsonb(old)-array['coach_focus','kit_list'])
    and not (
      (to_jsonb(new)-array['starts_at','ends_at']) is not distinct from (to_jsonb(old)-array['starts_at','ends_at'])
      and star_private.is_confirmed_booking_move(new.source_session_id,new.starts_at,new.ends_at)
    ) then
    raise exception 'Only managers can change published session details.' using errcode='42501';
  end if;
  return new;
end $$;
revoke all on function star_private.limit_session_focus_edit() from public,anon,authenticated;

create function star_private.player_session_available(
  p_player uuid,p_start timestamptz,p_end timestamptz,p_ignore_session uuid default null
) returns boolean
language sql stable set search_path='' as $$
  select not exists(
    select 1 from public.family_session_schedule f
    where f.player_id=p_player
      and (p_ignore_session is null or f.source_session_id is distinct from p_ignore_session)
      and f.starts_at<p_end and f.ends_at>p_start
  ) and not exists(
    select 1 from public.training_session_participants r join public.training_sessions s on s.id=r.session_id
    where r.player_id=p_player and s.id is distinct from p_ignore_session
      and s.cancelled_at is null and s.starts_at<p_end and s.ends_at>p_start
  )
$$;
revoke all on function star_private.player_session_available(uuid,timestamptz,timestamptz,uuid) from public,anon,authenticated;

create function star_private.available_player_slots(
  p_player uuid,p_day date,p_minutes integer,p_coach uuid,p_ignore_session uuid default null
) returns table(starts_at timestamptz,ends_at timestamptz)
language sql stable set search_path='' as $$
  select slots.start_time, slots.start_time+make_interval(mins=>p_minutes)
  from generate_series(
    (p_day+time '10:00') at time zone 'Europe/London',
    (p_day+time '20:00') at time zone 'Europe/London',
    interval '15 minutes'
  ) as slots(start_time)
  where p_day between (now() at time zone 'Europe/London')::date and (now() at time zone 'Europe/London')::date+364
    and star_private.booking_open(slots.start_time,slots.start_time+make_interval(mins=>p_minutes))
    and star_private.player_session_available(p_player,slots.start_time,slots.start_time+make_interval(mins=>p_minutes),p_ignore_session)
    and case when p_coach is null then not exists(
      select 1 from public.training_sessions s
      where s.id is distinct from p_ignore_session and s.cancelled_at is null
        and s.starts_at<slots.start_time+make_interval(mins=>p_minutes+30)
        and s.ends_at+interval '30 minutes'>slots.start_time
    ) else star_private.booking_free(p_coach,slots.start_time,slots.start_time+make_interval(mins=>p_minutes),p_ignore_session) end
  order by slots.start_time
$$;
revoke all on function star_private.available_player_slots(uuid,date,integer,uuid,uuid) from public,anon,authenticated;

create function star_private.staff_player_slots(p_player uuid,p_day date,p_minutes integer)
returns table(starts_at timestamptz,ends_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
  if not star_private.is_staff_manager() then
    raise exception 'STAR management access required.' using errcode='42501';
  end if;
  if p_minutes not in (60,90) or not exists(select 1 from public.coaching_players where id=p_player) then
    raise exception 'Choose a player and coaching programme.';
  end if;
  return query select * from star_private.available_player_slots(p_player,p_day,p_minutes,null);
end $$;

create function star_private.staff_book_player(
  p_session uuid,p_player uuid,p_programme text,p_starts_at timestamptz,p_venue text,p_focus text
) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid();
  session_title text;
  finish timestamptz;
  focus text:=nullif(btrim(p_focus),'');
  booking_venue text:=btrim(p_venue);
begin
  if not star_private.is_staff_manager() then
    raise exception 'STAR management access required.' using errcode='42501';
  end if;
  session_title:=case p_programme when '1-to-1' then 'One to One Coaching' when 'Flyers' then 'STAR Flyers'
    when 'Prestige' then 'STAR Prestige' when 'Other' then 'Individual coaching' end;
  if p_session is null or session_title is null or p_starts_at is null
     or coalesce(length(booking_venue),0) not between 2 and 150 or length(focus)>500 then
    raise exception 'Choose the coaching session, UK start time and venue.';
  end if;
  if not exists(select 1 from public.coaching_players where id=p_player) then
    raise exception 'Choose an existing player record.';
  end if;
  finish:=p_starts_at+make_interval(mins=>case when p_programme='Prestige' then 90 else 60 end);

  perform pg_advisory_xact_lock(781493201);
  if exists(select 1 from public.training_sessions where id=p_session) then
    if exists(
      select 1 from public.training_sessions s join public.family_session_schedule f on f.source_session_id=s.id
      where s.id=p_session and s.created_by=actor and f.player_id=p_player
        and (s.programme,s.starts_at,s.venue,f.coach_focus)
        is not distinct from (p_programme,p_starts_at,booking_venue,focus)
    ) then return p_session; end if;
    raise exception 'This booking was already saved or changed. Refresh the calendar.';
  end if;

  if not star_private.booking_open(p_starts_at,finish) then
    raise exception 'Choose a future time during opening hours.';
  end if;
  if not star_private.player_session_available(p_player,p_starts_at,finish) then
    raise exception 'This player already has a session at that time.';
  end if;
  insert into public.training_sessions(id,title,programme,starts_at,ends_at,venue,created_by)
  values (p_session,session_title,p_programme,p_starts_at,finish,booking_venue,actor);
  -- The family projection trigger adds the participant and both portals read the projection.
  insert into public.family_session_schedule(player_id,source_session_id,title,starts_at,ends_at,venue,published_by,coach_focus)
  values (p_player,p_session,session_title,p_starts_at,finish,booking_venue,actor,focus);
  return p_session;
end $$;

create function star_private.movable_player_session(p_booking uuid)
returns public.training_sessions
language plpgsql stable security definer set search_path='' as $$
declare
  appointment public.training_sessions;
begin
  select s.* into appointment
  from public.family_session_schedule f
  join public.training_sessions s on s.id=f.source_session_id
  left join star_private.booking_sessions b on b.session_id=s.id
  where f.id=p_booking and (star_private.is_player_family(f.player_id) or star_private.is_staff_manager())
    and s.organisation_id is null and s.cancelled_at is null and s.completed_at is null and s.starts_at>now()
    and s.programme='1-to-1'
    and (b.session_id is null or (b.service_id='one_to_one' and b.enabled and exists(
      select 1 from star_private.booking_places p where p.session_id=s.id and p.player_id=f.player_id and p.cancelled_at is null
    )))
    and exists(select 1 from public.training_session_participants p where p.session_id=s.id and p.player_id=f.player_id)
    and not exists(select 1 from public.training_session_participants p where p.session_id=s.id and p.player_id<>f.player_id)
    and not exists(select 1 from public.family_session_schedule other where other.source_session_id=s.id and other.id<>f.id)
    and not exists(select 1 from public.training_attendance a where a.session_id=s.id);
  return appointment;
end $$;
revoke all on function star_private.movable_player_session(uuid) from public,anon,authenticated;

create function star_private.player_move_slots(p_booking uuid,p_day date)
returns table(starts_at timestamptz,ends_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
declare
  appointment public.training_sessions:=star_private.movable_player_session(p_booking);
  player uuid;
  coach uuid;
begin
  if appointment.id is null then return; end if;
  select f.player_id into player from public.family_session_schedule f where f.id=p_booking;
  select b.coach_id into coach from star_private.booking_sessions b where b.session_id=appointment.id;
  return query
    select a.starts_at,a.ends_at
    from star_private.available_player_slots(player,p_day,
      (extract(epoch from appointment.ends_at-appointment.starts_at)/60)::integer,coach,appointment.id) a
    where a.starts_at<>appointment.starts_at;
end $$;

create function star_private.move_player_booking(
  p_booking uuid,p_expected_start timestamptz,p_new_start timestamptz
) returns timestamptz
language plpgsql security definer set search_path='' as $$
declare
  appointment public.training_sessions;
  finish timestamptz;
begin
  perform pg_advisory_xact_lock(781493201);
  appointment:=star_private.movable_player_session(p_booking);
  if appointment.id is null or p_new_start is null then
    raise exception 'This booking can no longer be moved here. Contact STAR for help.';
  end if;
  -- A lost response may be retried without adding a booking or an extra update.
  if appointment.starts_at=p_new_start then return p_new_start; end if;
  if appointment.starts_at is distinct from p_expected_start then
    raise exception 'The session already changed. Refresh your sessions before moving it.';
  end if;
  perform 1 from public.training_sessions where id=appointment.id for update nowait;
  select s.ends_at into finish
  from star_private.player_move_slots(p_booking,(p_new_start at time zone 'Europe/London')::date) s
  where s.starts_at=p_new_start;
  if finish is null then
    raise exception 'That time is no longer available. Your original booking is still in place.';
  end if;
  insert into star_private.booking_moves(session_id,moved_by,previous_start,starts_at,ends_at)
  values(appointment.id,auth.uid(),appointment.starts_at,p_new_start,finish);
  update public.training_sessions set starts_at=p_new_start,ends_at=finish where id=appointment.id;
  return p_new_start;
end $$;

create function star_private.open_player_venue(p_booking uuid,p_version uuid)
returns timestamptz
language plpgsql security definer set search_path='' as $$
declare
  opened timestamptz;
begin
  insert into star_private.venue_openings(family_session_id,guardian_id,venue_version)
  select f.id,auth.uid(),f.venue_version from public.family_session_schedule f
  where f.id=p_booking and f.venue_version=p_version and star_private.is_player_family(f.player_id)
  on conflict do nothing;
  select o.opened_at into opened
  from star_private.venue_openings o join public.family_session_schedule f on f.id=o.family_session_id
  where f.id=p_booking and o.guardian_id=auth.uid() and o.venue_version=p_version
    and f.venue_version=p_version and star_private.is_player_family(f.player_id);
  if opened is null then
    raise exception 'These venue details changed or are no longer available.';
  end if;
  return opened;
end $$;

create function star_private.session_venue_openings(p_session uuid)
returns table(family_session_id uuid,player_id uuid,guardian_name text,opened_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
begin
  if not star_private.is_staff_manager() then
    raise exception 'STAR management access required.' using errcode='42501';
  end if;
  return query
    select f.id,f.player_id,coalesce(nullif(gp.display_name,''),'Linked guardian'),o.opened_at
    from public.family_session_schedule f
    join public.guardian_player_links g on g.player_id=f.player_id
    left join public.guardian_profiles gp on gp.user_id=g.guardian_id
    left join star_private.venue_openings o
      on o.family_session_id=f.id and o.guardian_id=g.guardian_id and o.venue_version=f.venue_version
    where f.source_session_id=p_session
    order by gp.display_name,g.guardian_id;
end $$;

create function star_private.prevent_early_attendance() returns trigger
language plpgsql set search_path='' as $$
begin
  if new.status in ('present','late') and exists(
    select 1 from public.training_sessions s where s.id=new.session_id and s.starts_at>now()
  ) then raise exception 'Present or late can be recorded once the session starts.'; end if;
  return new;
end $$;
revoke all on function star_private.prevent_early_attendance() from public,anon,authenticated;
create trigger prevent_early_attendance before insert or update on public.training_attendance
for each row execute function star_private.prevent_early_attendance();

create function star_private.complete_training_session(p_session uuid,p_register jsonb,p_notes jsonb)
returns timestamptz
language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid();
  appointment public.training_sessions;
  roster_size integer;
  stamp timestamptz;
begin
  if not star_private.is_active_staff() then
    raise exception 'STAR coaching access required.' using errcode='42501';
  end if;
  perform pg_advisory_xact_lock(781493201);
  select s.* into appointment from public.training_sessions s where s.id=p_session for update nowait;
  if appointment.id is null or appointment.organisation_id is not null or appointment.cancelled_at is not null
     or exists(select 1 from star_private.org_session_details where session_id=p_session) then
    raise exception 'Choose an active STAR family or group session.';
  end if;
  if exists(select 1 from public.training_session_participants p
      where p.session_id=p_session and not star_private.can_coach_player(p.player_id)) then
    raise exception 'You need coaching access to the players on this register.' using errcode='42501';
  end if;
  if appointment.completed_at is not null then return appointment.completed_at; end if;
  if appointment.ends_at>now() then raise exception 'You can finish this session after it ends.'; end if;
  if jsonb_typeof(p_register) is distinct from 'array' or jsonb_typeof(p_notes) is distinct from 'array'
     or jsonb_array_length(p_register)>100 or jsonb_array_length(p_notes)>100 then
    raise exception 'Review the session register and notes.';
  end if;
  select count(*) into roster_size from public.training_session_participants where session_id=p_session;
  if roster_size=0 or jsonb_array_length(p_register)<>roster_size or (
    select count(distinct p.player_id)
    from jsonb_to_recordset(p_register) as a(player_id uuid,status text)
    join public.training_session_participants p on p.session_id=p_session and p.player_id=a.player_id
    where a.status in ('present','late','absent','excused')
  )<>roster_size then
    raise exception 'Choose an attendance mark for each player on the current roster.';
  end if;
  if exists(
    select 1 from jsonb_to_recordset(p_notes) as a(player_id uuid,category text,observation text,next_action text)
    where coalesce(a.category,'') not in ('Technical','Tactical','Physical','Psychological','Social')
      or coalesce(length(btrim(a.observation)),0) not between 5 and 1500
      or coalesce(length(btrim(a.next_action)),0)>500
      or not exists(select 1 from public.training_session_participants p where p.session_id=p_session and p.player_id=a.player_id)
  ) then raise exception 'Check the player and length of each coaching observation.'; end if;

  insert into public.training_attendance(session_id,player_id,status,recorded_by,recorded_at)
  select p_session,a.player_id,a.status,actor,now() from jsonb_to_recordset(p_register) as a(player_id uuid,status text)
  on conflict(session_id,player_id) do update set status=excluded.status,recorded_by=excluded.recorded_by,recorded_at=excluded.recorded_at
  where training_attendance.status is distinct from excluded.status;
  insert into public.coaching_observations(player_id,session_id,recorded_by,stage,category,observation,next_action)
  select a.player_id,p_session,actor,'Review',a.category,btrim(a.observation),nullif(btrim(a.next_action),'')
  from jsonb_to_recordset(p_notes) as a(player_id uuid,category text,observation text,next_action text);
  update public.training_sessions set completed_at=clock_timestamp(),completed_by=actor
  where id=p_session returning completed_at into stamp;
  return stamp;
end $$;

create function public.star_staff_player_slots(p_player uuid,p_day date,p_minutes integer)
returns table(starts_at timestamptz,ends_at timestamptz)
language sql stable security invoker set search_path='' as $$
  select * from star_private.staff_player_slots(p_player,p_day,p_minutes)
$$;
create function public.star_staff_book_player(
  p_session uuid,p_player uuid,p_programme text,p_starts_at timestamptz,p_venue text,p_focus text
) returns uuid language sql security invoker set search_path='' as $$
  select star_private.staff_book_player(p_session,p_player,p_programme,p_starts_at,p_venue,p_focus)
$$;
create function public.star_player_move_slots(p_booking uuid,p_day date)
returns table(starts_at timestamptz,ends_at timestamptz)
language sql stable security invoker set search_path='' as $$
  select * from star_private.player_move_slots(p_booking,p_day)
$$;
create function public.star_move_player_booking(p_booking uuid,p_expected_start timestamptz,p_new_start timestamptz)
returns timestamptz language sql security invoker set search_path='' as $$
  select star_private.move_player_booking(p_booking,p_expected_start,p_new_start)
$$;
create function public.star_open_player_venue(p_booking uuid,p_version uuid)
returns timestamptz language sql security invoker set search_path='' as $$
  select star_private.open_player_venue(p_booking,p_version)
$$;
create function public.star_session_venue_openings(p_session uuid)
returns table(family_session_id uuid,player_id uuid,guardian_name text,opened_at timestamptz)
language sql stable security invoker set search_path='' as $$
  select * from star_private.session_venue_openings(p_session)
$$;
create function public.star_complete_training_session(p_session uuid,p_register jsonb,p_notes jsonb)
returns timestamptz language sql security invoker set search_path='' as $$
  select star_private.complete_training_session(p_session,p_register,p_notes)
$$;

create function public.star_save_session_plan(
  p_plan uuid,p_session uuid,p_title text,p_content jsonb,p_expected timestamptz
)
returns uuid language plpgsql security invoker set search_path='' as $$
declare
  actor uuid:=auth.uid();
begin
  if not star_private.is_active_staff() then
    raise exception 'STAR coaching access required.' using errcode='42501';
  end if;
  if p_expected is null then
    insert into public.staff_session_plans(id,created_by,title,plan)
    values(p_plan,actor,btrim(p_title),p_content) on conflict(id) do nothing;
  else
    update public.staff_session_plans set title=btrim(p_title),plan=p_content,updated_at=clock_timestamp()
    where id=p_plan and created_by=actor and updated_at=p_expected;
  end if;
  if not exists(select 1 from public.staff_session_plans
      where id=p_plan and created_by=actor and title=btrim(p_title) and plan=p_content) then
    raise exception 'This plan changed elsewhere. Reopen it or save a new copy.';
  end if;
  insert into public.staff_session_plan_links(created_by,training_session_id,plan_id)
  values(actor,p_session,p_plan)
  on conflict(created_by,training_session_id) do update set plan_id=excluded.plan_id;
  return p_plan;
end $$;

revoke all on function
  star_private.staff_player_slots(uuid,date,integer),
  star_private.staff_book_player(uuid,uuid,text,timestamptz,text,text),
  star_private.player_move_slots(uuid,date),
  star_private.move_player_booking(uuid,timestamptz,timestamptz),
  star_private.open_player_venue(uuid,uuid),
  star_private.session_venue_openings(uuid),
  star_private.complete_training_session(uuid,jsonb,jsonb),
  public.star_staff_player_slots(uuid,date,integer),
  public.star_staff_book_player(uuid,uuid,text,timestamptz,text,text),
  public.star_player_move_slots(uuid,date),
  public.star_move_player_booking(uuid,timestamptz,timestamptz),
  public.star_open_player_venue(uuid,uuid),
  public.star_session_venue_openings(uuid),
  public.star_complete_training_session(uuid,jsonb,jsonb),
  public.star_save_session_plan(uuid,uuid,text,jsonb,timestamptz)
from public,anon;
grant execute on function
  star_private.staff_player_slots(uuid,date,integer),
  star_private.staff_book_player(uuid,uuid,text,timestamptz,text,text),
  star_private.player_move_slots(uuid,date),
  star_private.move_player_booking(uuid,timestamptz,timestamptz),
  star_private.open_player_venue(uuid,uuid),
  star_private.session_venue_openings(uuid),
  star_private.complete_training_session(uuid,jsonb,jsonb),
  public.star_staff_player_slots(uuid,date,integer),
  public.star_staff_book_player(uuid,uuid,text,timestamptz,text,text),
  public.star_player_move_slots(uuid,date),
  public.star_move_player_booking(uuid,timestamptz,timestamptz),
  public.star_open_player_venue(uuid,uuid),
  public.star_session_venue_openings(uuid),
  public.star_complete_training_session(uuid,jsonb,jsonb),
  public.star_save_session_plan(uuid,uuid,text,jsonb,timestamptz)
to authenticated;

create function star_private.movable_player_bookings(p_player uuid)
returns uuid[] language plpgsql stable security definer set search_path='' as $$
declare
  ids uuid[];
begin
  if not (star_private.is_staff_manager() or star_private.is_player_family(p_player)) then
    return '{}'::uuid[];
  end if;
  select array_agg(f.id order by f.starts_at) into ids
  from public.family_session_schedule f
  where f.player_id=p_player and f.starts_at>now()
    and (star_private.movable_player_session(f.id)).id is not null;
  return coalesce(ids,'{}'::uuid[]);
end $$;

create function public.star_movable_player_bookings(p_player uuid)
returns uuid[] language sql stable security invoker set search_path='' as $$
  select star_private.movable_player_bookings(p_player)
$$;
revoke all on function star_private.movable_player_bookings(uuid),public.star_movable_player_bookings(uuid) from public,anon;
grant execute on function star_private.movable_player_bookings(uuid),public.star_movable_player_bookings(uuid) to authenticated;
