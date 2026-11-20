create table star_private.player_programme_blocks (
  id uuid primary key,
  player_id uuid not null references public.coaching_players(id) on delete cascade,
  coach_id uuid not null references public.staff_members(user_id),
  programme text not null check(programme in ('Flyers','Prestige')),
  created_by uuid not null references auth.users(id),
  request jsonb not null,
  created_at timestamptz not null default now()
);
create table star_private.programme_weeks (
  session_id uuid primary key references public.training_sessions(id) on delete cascade deferrable initially deferred,
  block_id uuid not null references star_private.player_programme_blocks(id) on delete cascade,
  week integer not null check(week between 1 and 24),
  unique(block_id,week)
);
create index programme_blocks_player on star_private.player_programme_blocks(player_id);
alter table star_private.player_programme_blocks enable row level security;
alter table star_private.programme_weeks enable row level security;
revoke all on star_private.player_programme_blocks,star_private.programme_weeks from public,anon,authenticated;

create function star_private.programme_coach(p_session uuid) returns uuid
language sql stable security definer set search_path='' as $$
  select b.coach_id from star_private.programme_weeks w join star_private.player_programme_blocks b on b.id=w.block_id where w.session_id=p_session
$$;
revoke all on function star_private.programme_coach(uuid) from public,anon,authenticated;

create or replace function star_private.booking_free(p_coach uuid,p_start timestamptz,p_end timestamptz,p_ignore uuid default null)
returns boolean language sql stable security definer set search_path='' as $$
  select not exists(
    select 1 from public.training_sessions s
    left join star_private.org_session_details d on d.session_id=s.id
    left join star_private.booking_sessions direct on direct.session_id=s.id
    left join star_private.programme_weeks w on w.session_id=s.id
    left join star_private.player_programme_blocks block on block.id=w.block_id
    where s.cancelled_at is null and s.id is distinct from p_ignore
      and coalesce(direct.coach_id,d.coach_id,block.coach_id,p_coach)=p_coach
      and s.starts_at<p_end+interval '30 minutes' and s.ends_at+interval '30 minutes'>p_start
  )
$$;

create function star_private.programme_coaches(p_player uuid) returns table(id uuid,name text)
language sql stable security definer set search_path='' as $$
  select s.user_id,coalesce(nullif(c.coach_name,''),nullif(u.raw_user_meta_data->>'full_name',''),
    nullif(u.raw_user_meta_data->>'name',''),u.email,'STAR coach')
  from public.staff_members s join auth.users u on u.id=s.user_id
  left join star_private.booking_coaches c on c.coach_id=s.user_id
  where star_private.is_staff_manager() and s.active and (s.role in ('owner','manager') or exists(
    select 1 from public.coaching_assignments a where a.player_id=p_player and a.staff_user_id=s.user_id
  )) order by 2,s.user_id
$$;
create function public.star_programme_coaches(p_player uuid) returns table(id uuid,name text)
language sql stable security invoker set search_path='' as $$ select * from star_private.programme_coaches(p_player) $$;

create function star_private.preview_programme_block(p_player uuid,p_coach uuid,p_programme text,p_dates text[])
returns table(week integer,starts_at timestamptz,ends_at timestamptz,issue text)
language plpgsql stable security definer set search_path='' as $$
declare
  expected integer:=case p_programme when 'Flyers' then 16 when 'Prestige' then 24 end;
  duration interval:=case p_programme when 'Flyers' then interval '60 minutes' when 'Prestige' then interval '90 minutes' end;
begin
  if not star_private.is_staff_manager() then raise exception 'STAR management access required.' using errcode='42501'; end if;
  if expected is null or cardinality(p_dates) is distinct from expected then raise exception 'Preview every date in the programme.'; end if;
  if not exists(select 1 from public.coaching_players where id=p_player) or not exists(
    select 1 from star_private.programme_coaches(p_player) c where c.id=p_coach
  ) then raise exception 'Choose an active coach who can coach this player.'; end if;
  return query
  with dates as materialized (
    select n::int as number,star_private.org_uk_time(d) as start_time from unnest(p_dates) with ordinality a(d,n)
  )
  select d.number,d.start_time,d.start_time+duration,case
    when not star_private.booking_open(d.start_time,d.start_time+duration) then 'Outside opening hours or the booking window'
    when exists(select 1 from dates x where x.number<>d.number and x.start_time<d.start_time+duration+interval '30 minutes'
      and x.start_time+duration+interval '30 minutes'>d.start_time) then 'Clashes with another date in this block'
    when exists(select 1 from dates x where x.number<d.number and x.start_time>=d.start_time) then 'Place this session after the previous week'
    when not star_private.player_session_available(p_player,d.start_time,d.start_time+duration) then 'Player already booked'
    when not star_private.booking_free(p_coach,d.start_time,d.start_time+duration) then 'Coach booked or travelling'
    else null end
  from dates d order by d.number;
end $$;
create function public.star_preview_programme_block(p_player uuid,p_coach uuid,p_programme text,p_dates text[])
returns table(week integer,starts_at timestamptz,ends_at timestamptz,issue text)
language sql stable security invoker set search_path='' as $$ select * from star_private.preview_programme_block(p_player,p_coach,p_programme,p_dates) $$;

create function star_private.book_programme_block(p_request uuid,p_player uuid,p_coach uuid,p_programme text,p_venue text,p_dates text[],p_plan uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare
  actor uuid:=auth.uid();
  venue_text text:=btrim(p_venue);
  specification jsonb:=jsonb_build_object('player',p_player,'coach',p_coach,'programme',p_programme,'venue',venue_text,'dates',p_dates,'plan',p_plan);
  saved star_private.player_programme_blocks;
  week_row record;
  preview jsonb;
  first_id uuid;
  session_id uuid;
  coach_plan uuid:=p_plan;
  title_text text;
begin
  if not star_private.is_staff_manager() then raise exception 'STAR management access required.' using errcode='42501'; end if;
  if p_request is null or coalesce(length(venue_text),0) not between 2 and 150 then raise exception 'Choose a venue for this programme.'; end if;
  perform pg_advisory_xact_lock(781493201);
  select * into saved from star_private.player_programme_blocks where id=p_request;
  if found then
    if saved.created_by<>actor or saved.request<>specification then raise exception 'This booking reference was already used.'; end if;
    return (select w.session_id from star_private.programme_weeks w where w.block_id=p_request and w.week=1);
  end if;
  select jsonb_agg(to_jsonb(p) order by p.week) into preview from star_private.preview_programme_block(p_player,p_coach,p_programme,p_dates) p;
  select * into week_row from jsonb_to_recordset(preview) as p(week int,issue text) where issue is not null limit 1;
  if found then raise exception 'Week %: %. Check the dates again.',week_row.week,week_row.issue; end if;
  if p_plan is not null then
    perform 1 from public.staff_session_plans where id=p_plan and created_by=actor for share;
    if not found then raise exception 'Choose one of your saved coaching plans.'; end if;
    if p_coach<>actor then
      insert into public.staff_session_plans(created_by,title,plan) select p_coach,title,plan from public.staff_session_plans where id=p_plan returning id into coach_plan;
    end if;
  end if;
  insert into star_private.player_programme_blocks(id,player_id,coach_id,programme,created_by,request)
  values(p_request,p_player,p_coach,p_programme,actor,specification);
  for week_row in select * from jsonb_to_recordset(preview) as p(week integer,starts_at timestamptz,ends_at timestamptz) order by week loop
    session_id:=gen_random_uuid();
    title_text:=format('STAR %s · week %s of %s',p_programme,week_row.week,cardinality(p_dates));
    insert into star_private.programme_weeks values(session_id,p_request,week_row.week);
    insert into public.training_sessions(id,title,programme,starts_at,ends_at,venue,created_by)
    values(session_id,title_text,p_programme,week_row.starts_at,week_row.ends_at,venue_text,actor);
    insert into public.family_session_schedule(player_id,source_session_id,title,starts_at,ends_at,venue,published_by)
    values(p_player,session_id,title_text,week_row.starts_at,week_row.ends_at,venue_text,actor);
    if p_plan is not null then
      insert into public.staff_session_plan_links(created_by,plan_id,training_session_id) values(actor,p_plan,session_id);
      if p_coach<>actor then insert into public.staff_session_plan_links(created_by,plan_id,training_session_id) values(p_coach,coach_plan,session_id); end if;
    end if;
    if week_row.week=1 then first_id:=session_id; end if;
  end loop;
  return first_id;
end $$;
create function public.star_book_programme_block(p_request uuid,p_player uuid,p_coach uuid,p_programme text,p_venue text,p_dates text[],p_plan uuid default null)
returns uuid language sql security invoker set search_path='' as $$
  select star_private.book_programme_block(p_request,p_player,p_coach,p_programme,p_venue,p_dates,p_plan)
$$;

revoke all on function star_private.programme_coaches(uuid),public.star_programme_coaches(uuid),
  star_private.preview_programme_block(uuid,uuid,text,text[]),public.star_preview_programme_block(uuid,uuid,text,text[]),
  star_private.book_programme_block(uuid,uuid,uuid,text,text,text[],uuid),public.star_book_programme_block(uuid,uuid,uuid,text,text,text[],uuid) from public,anon;
grant execute on function star_private.programme_coaches(uuid),public.star_programme_coaches(uuid),
  star_private.preview_programme_block(uuid,uuid,text,text[]),public.star_preview_programme_block(uuid,uuid,text,text[]),
  star_private.book_programme_block(uuid,uuid,uuid,text,text,text[],uuid),public.star_book_programme_block(uuid,uuid,uuid,text,text,text[],uuid) to authenticated;

-- Only the first booking announces a new block. Later moves and venue changes still notify normally.
create function star_private.announce_programme_week(p_session uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select not exists(select 1 from star_private.programme_weeks where session_id=p_session and week>1)
$$;
revoke all on function star_private.announce_programme_week(uuid) from public,anon;
grant execute on function star_private.announce_programme_week(uuid) to authenticated;
drop trigger notify_parent_update on public.family_session_schedule;
create trigger notify_parent_update after update or delete on public.family_session_schedule for each row execute function star_private.notify_parent_update();
create trigger notify_parent_new_session after insert on public.family_session_schedule for each row when (star_private.announce_programme_week(new.source_session_id)) execute function star_private.notify_parent_update();
drop trigger notify_player_update on public.family_session_schedule;
create trigger notify_player_update after update on public.family_session_schedule for each row execute function star_private.notify_player_update();
create trigger notify_player_new_session after insert on public.family_session_schedule for each row when (star_private.announce_programme_week(new.source_session_id)) execute function star_private.notify_player_update();


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
    select coalesce(booking.coach_id,(select coach_id from star_private.org_session_details where session_id=new.id),star_private.programme_coach(new.id)) into coach;
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

create or replace function star_private.movable_player_session(p_booking uuid)
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
    and (s.programme='1-to-1' or exists(select 1 from star_private.programme_weeks w join star_private.player_programme_blocks pb on pb.id=w.block_id where w.session_id=s.id and pb.player_id=f.player_id and pb.programme=s.programme))
    and (b.session_id is null or (b.service_id='one_to_one' and b.enabled and exists(
      select 1 from star_private.booking_places p where p.session_id=s.id and p.player_id=f.player_id and p.cancelled_at is null
    )))
    and exists(select 1 from public.training_session_participants p where p.session_id=s.id and p.player_id=f.player_id)
    and not exists(select 1 from public.training_session_participants p where p.session_id=s.id and p.player_id<>f.player_id)
    and not exists(select 1 from public.family_session_schedule other where other.source_session_id=s.id and other.id<>f.id)
    and not exists(select 1 from public.training_attendance a where a.session_id=s.id);
  return appointment;
end $$;

create or replace function star_private.player_move_slots(p_booking uuid,p_day date)
returns table(starts_at timestamptz,ends_at timestamptz)
language plpgsql stable security definer set search_path='' as $$
declare
  appointment public.training_sessions:=star_private.movable_player_session(p_booking);
  player uuid;
  coach uuid;
begin
  if appointment.id is null then return; end if;
  select f.player_id into player from public.family_session_schedule f where f.id=p_booking;
  select coalesce((select b.coach_id from star_private.booking_sessions b where b.session_id=appointment.id),star_private.programme_coach(appointment.id)) into coach;
  return query
    select a.starts_at,a.ends_at
    from star_private.available_player_slots(player,p_day,
      (extract(epoch from appointment.ends_at-appointment.starts_at)/60)::integer,coach,appointment.id) a
    where a.starts_at<>appointment.starts_at;
end $$;
